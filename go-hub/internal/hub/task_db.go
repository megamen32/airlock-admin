package hub

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const taskDatabaseFilename = "tasks_state.sqlite"

// Each operation owns a bounded connection. There is no background writer,
// debounce window, process-lifetime file lock, or unclosed per-Server DB pool.
// SQLite serializes primary/standby writers; the transaction is durable before
// the caller acknowledges the operation. FULL must not be changed to NORMAL.
type taskTransaction struct{ tx *sql.Tx }

func (s *Server) taskDatabasePath() string {
	if s.cfg.ConfigDir == "" {
		return ""
	}
	return filepath.Join(s.cfg.ConfigDir, taskDatabaseFilename)
}

func openTaskDatabase(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, err
	}
	// Set the database mode before SQLite creates journals alongside it.
	f, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	if err = f.Close(); err != nil {
		return nil, err
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	uri := url.URL{Scheme: "file", Path: filepath.ToSlash(absolute)}
	q := url.Values{}
	q.Add("_pragma", "busy_timeout(10000)")
	q.Add("_pragma", "journal_mode(WAL)")
	q.Add("_pragma", "synchronous(FULL)")
	q.Set("_txlock", "immediate")
	uri.RawQuery = q.Encode()
	db, err := sql.Open("sqlite", uri.String())
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	return db, nil
}

func (s *Server) withTaskDatabase(fn func(*taskTransaction) error) error {
	path := s.taskDatabasePath()
	if path == "" {
		return nil
	}
	db, err := openTaskDatabase(path)
	if err != nil {
		return err
	}
	defer db.Close()
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, ddl := range []string{
		`CREATE TABLE IF NOT EXISTS task_records (
    kind TEXT NOT NULL, key TEXT NOT NULL, updated REAL NOT NULL,
    done REAL NOT NULL DEFAULT 0, payload BLOB NOT NULL,
    PRIMARY KEY(kind,key)) WITHOUT ROWID`,
		`CREATE INDEX IF NOT EXISTS task_records_done ON task_records(done) WHERE done > 0`,
		`CREATE INDEX IF NOT EXISTS task_records_updated ON task_records(kind,updated)`,
		`CREATE TABLE IF NOT EXISTS task_store_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL)`,
	} {
		if _, err = tx.Exec(ddl); err != nil {
			return err
		}
	}
	var version int
	err = tx.QueryRow(`SELECT version FROM task_store_meta WHERE id=1`).Scan(&version)
	store := &taskTransaction{tx: tx}
	if errors.Is(err, sql.ErrNoRows) {
		// The legacy snapshot is a read-only migration source/rollback backup. Import
		// and the migration marker share one transaction, including after a crash.
		err = withStateFileLock(s.taskStatePath(), func() error {
			data, readErr := os.ReadFile(s.taskStatePath())
			if errors.Is(readErr, os.ErrNotExist) {
				return nil
			}
			if readErr != nil {
				return readErr
			}
			var legacy persistedTaskState
			if err := json.Unmarshal(data, &legacy); err != nil {
				return fmt.Errorf("task snapshot migration: %w", err)
			}
			return store.save(legacy)
		})
		if err != nil {
			return err
		}
		if _, err = tx.Exec(`INSERT INTO task_store_meta(id,version) VALUES(1,1)`); err != nil {
			return err
		}
	} else if err != nil {
		return err
	} else if version != 1 {
		return fmt.Errorf("unsupported task database version %d", version)
	}
	if err = fn(store); err != nil {
		return err
	}
	return tx.Commit()
}

func (t *taskTransaction) save(state persistedTaskState) error {
	stmt, err := t.tx.Prepare(`INSERT INTO task_records(kind,key,updated,done,payload) VALUES(?,?,?,?,?)
 ON CONFLICT(kind,key) DO UPDATE SET updated=excluded.updated,done=excluded.done,payload=excluded.payload
 WHERE excluded.updated >= task_records.updated AND excluded.payload != task_records.payload`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	put := func(kind, key string, updated, done float64, value any) error {
		payload, err := json.Marshal(value)
		if err != nil {
			return err
		}
		_, err = stmt.Exec(kind, key, updated, done, payload)
		return err
	}
	for key, p := range state.Relay {
		if err = put("relay", key, persistedTaskUpdated(p.CreatedAt, p.StartedAt, p.DoneAt), p.DoneAt, p); err != nil {
			return err
		}
	}
	for key, p := range state.Shell {
		if err = put("shell", key, persistedTaskUpdated(p.CreatedAt, p.StartedAt, p.DoneAt), p.DoneAt, p); err != nil {
			return err
		}
	}
	for key, p := range state.Idempotency {
		if err = put("idempotency", key, float64(p.CreatedAt.UnixNano())/1e9, 0, p); err != nil {
			return err
		}
	}
	return nil
}

func (t *taskTransaction) prune(taskCutoff, idempotencyCutoff float64) error {
	if _, err := t.tx.Exec(`DELETE FROM task_records WHERE done>0 AND done<?`, taskCutoff); err != nil {
		return err
	}
	_, err := t.tx.Exec(`DELETE FROM task_records WHERE kind='idempotency' AND updated<?`, idempotencyCutoff)
	return err
}

// readTaskState is the only full read, on restart/export; normal saves never
// load or serialize unrelated completed results.
func (s *Server) readTaskState() (persistedTaskState, error) {
	state := persistedTaskState{Relay: map[string]persistedRelayTask{}, Shell: map[string]persistedShellTask{}, Idempotency: map[string]persistedIdempotencyEntry{}}
	err := s.withTaskDatabase(func(t *taskTransaction) error {
		rows, err := t.tx.Query(`SELECT kind,key,payload FROM task_records`)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			var kind, key string
			var payload []byte
			if err := rows.Scan(&kind, &key, &payload); err != nil {
				return err
			}
			switch kind {
			case "relay":
				var p persistedRelayTask
				if err = json.Unmarshal(payload, &p); err != nil {
					return err
				}
				state.Relay[key] = p
			case "shell":
				var p persistedShellTask
				if err = json.Unmarshal(payload, &p); err != nil {
					return err
				}
				state.Shell[key] = p
			case "idempotency":
				var p persistedIdempotencyEntry
				if err = json.Unmarshal(payload, &p); err != nil {
					return err
				}
				state.Idempotency[key] = p
			default:
				return fmt.Errorf("unknown persisted task kind %q", kind)
			}
		}
		return rows.Err()
	})
	return state, err
}
