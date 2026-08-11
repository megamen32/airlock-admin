use crate::backend::IndexState;
use globset::{Glob, GlobSet, GlobSetBuilder};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    io::ErrorKind,
    path::{Path, PathBuf},
    sync::{mpsc, Arc, RwLock},
    thread,
    time::Duration,
};

#[derive(Clone, Debug)]
pub struct IndexSnapshot {
    pub state: IndexState,
    pub generation: u64,
    pub indexed_files: usize,
    pub last_error: Option<String>,
}

impl Default for IndexSnapshot {
    fn default() -> Self {
        Self {
            state: IndexState::Building,
            generation: 0,
            indexed_files: 0,
            last_error: None,
        }
    }
}

#[derive(Clone)]
pub struct IndexManager {
    snapshot: Arc<RwLock<IndexSnapshot>>,
    candidates: Arc<RwLock<BTreeMap<String, BTreeSet<PathBuf>>>>,
}

impl IndexManager {
    pub fn start(
        roots: BTreeMap<String, Vec<PathBuf>>,
        excludes: Vec<String>,
        max_file_bytes: u64,
    ) -> Self {
        let snapshot = Arc::new(RwLock::new(IndexSnapshot {
            state: IndexState::Building,
            ..Default::default()
        }));
        let state = Arc::clone(&snapshot);
        let candidates = Arc::new(RwLock::new(BTreeMap::new()));
        let candidate_state = Arc::clone(&candidates);
        thread::spawn(move || {
            let (events, rx) = mpsc::channel();
            let event_state = Arc::clone(&state);
            let mut watcher: RecommendedWatcher = notify::recommended_watcher(move |_| {
                if let Ok(mut current) = event_state.write() {
                    current.state = IndexState::Building;
                }
                let _ = events.send(());
            })
            .expect("create GrepMesh watcher");
            for root in unique_roots(&roots) {
                let _ = watcher.watch(&root, RecursiveMode::Recursive);
            }
            let mut generation = 0;
            let mut rebuild = || match build_index(&roots, &excludes, max_file_bytes) {
                Ok((count, next)) => {
                    if let Ok(mut map) = candidate_state.write() {
                        *map = next;
                    }
                    if let Ok(mut current) = state.write() {
                        generation += 1;
                        current.state = IndexState::Ready;
                        current.indexed_files = count;
                        current.last_error = None;
                        current.generation = generation;
                    }
                }
                Err(error) => {
                    if let Ok(mut current) = state.write() {
                        current.state = IndexState::Degraded;
                        current.last_error = Some(error);
                        current.generation = generation.saturating_add(1);
                    }
                }
            };
            rebuild();
            loop {
                if rx.recv_timeout(Duration::from_secs(30)).is_ok() {
                    while rx.try_recv().is_ok() {}
                    rebuild();
                }
            }
        });
        Self {
            snapshot,
            candidates,
        }
    }

    pub fn status(&self) -> IndexSnapshot {
        self.snapshot
            .read()
            .map(|s| s.clone())
            .unwrap_or(IndexSnapshot {
                state: IndexState::Degraded,
                ..Default::default()
            })
    }

    pub fn candidate_paths(&self, query: &str, root: &Path) -> Option<Vec<PathBuf>> {
        let status = self.status();
        if status.state != IndexState::Ready || status.indexed_files == 0 {
            return None;
        }
        let grams = trigrams(&query.to_ascii_lowercase());
        if grams.is_empty() {
            return None;
        }
        let map = self.candidates.read().ok()?;
        let mut sets = grams.iter().filter_map(|gram| map.get(gram));
        let first = sets.next().cloned().unwrap_or_default();
        let result: Vec<_> = sets
            .fold(first, |acc, set| acc.intersection(set).cloned().collect())
            .into_iter()
            .filter(|path| path.starts_with(root))
            .collect();
        Some(result)
    }
}

fn build_index(
    roots: &BTreeMap<String, Vec<PathBuf>>,
    excludes: &[String],
    max_file_bytes: u64,
) -> Result<(usize, BTreeMap<String, BTreeSet<PathBuf>>), String> {
    let matcher = compile_excludes(excludes)?;
    let mut count = 0;
    let mut map = BTreeMap::new();
    for root in unique_roots(roots) {
        count += walk(&root, &root, &matcher, max_file_bytes, &mut map)?;
    }
    Ok((count, map))
}

fn unique_roots(roots: &BTreeMap<String, Vec<PathBuf>>) -> BTreeSet<PathBuf> {
    roots.values().flatten().cloned().collect()
}

fn walk(
    path: &PathBuf,
    root: &Path,
    excludes: &GlobSet,
    max_file_bytes: u64,
    map: &mut BTreeMap<String, BTreeSet<PathBuf>>,
) -> Result<usize, String> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::PermissionDenied => return Ok(0),
        Err(error) => return Err(format!("{}: {error}", path.display())),
    };
    if metadata.file_type().is_symlink() {
        return Ok(0);
    }
    if metadata.is_file() {
        if excluded(path, root, excludes)
            || (max_file_bytes != 0 && metadata.len() > max_file_bytes)
        {
            return Ok(0);
        }
        let bytes = match fs::read(path) {
            Ok(bytes) => bytes,
            Err(error) if error.kind() == ErrorKind::PermissionDenied => return Ok(0),
            Err(error) => return Err(format!("{}: {error}", path.display())),
        };
        if bytes.contains(&0) {
            return Ok(0);
        }
        let text = match String::from_utf8(bytes) {
            Ok(text) => text.to_ascii_lowercase(),
            Err(_) => return Ok(0),
        };
        for gram in trigrams(&text) {
            map.entry(gram).or_default().insert(path.clone());
        }
        return Ok(1);
    }
    if !metadata.is_dir() {
        return Ok(0);
    }
    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(error) if error.kind() == ErrorKind::PermissionDenied => return Ok(0),
        Err(error) => return Err(format!("{}: {error}", path.display())),
    };
    let mut count = 0;
    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) if error.kind() == ErrorKind::PermissionDenied => continue,
            Err(error) => return Err(error.to_string()),
        };
        count += walk(&entry.path(), root, excludes, max_file_bytes, map)?;
    }
    Ok(count)
}

fn compile_excludes(excludes: &[String]) -> Result<GlobSet, String> {
    let mut builder = GlobSetBuilder::new();
    for pattern in excludes {
        builder.add(
            Glob::new(pattern).map_err(|error| format!("invalid exclude {pattern}: {error}"))?,
        );
    }
    builder
        .build()
        .map_err(|error| format!("compile excludes: {error}"))
}

fn trigrams(value: &str) -> BTreeSet<String> {
    let bytes = value.as_bytes();
    (0..bytes.len().saturating_sub(2))
        .map(|i| String::from_utf8_lossy(&bytes[i..i + 3]).into_owned())
        .collect()
}

fn excluded(path: &Path, root: &Path, excludes: &GlobSet) -> bool {
    excludes.is_match(path)
        || path
            .strip_prefix(root)
            .map(|relative| excludes.is_match(relative))
            .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    #[test]
    fn permission_denied_subtree_does_not_degrade_the_entire_index() {
        let root = tempfile::tempdir().unwrap();
        let readable = root.path().join("readable.txt");
        let denied = root.path().join("denied");
        fs::write(&readable, "INDEX_ACCESS_TOKEN\n").unwrap();
        fs::create_dir(&denied).unwrap();
        fs::write(denied.join("secret.txt"), "should-not-break-index\n").unwrap();
        let mut permissions = fs::metadata(&denied).unwrap().permissions();
        permissions.set_mode(0o000);
        fs::set_permissions(&denied, permissions).unwrap();

        let mut roots = BTreeMap::new();
        roots.insert("home".to_string(), vec![root.path().to_path_buf()]);
        let result = build_index(&roots, &[], 0);

        let mut restore = fs::metadata(&denied).unwrap().permissions();
        restore.set_mode(0o755);
        fs::set_permissions(&denied, restore).unwrap();
        let (count, candidates) = result.unwrap();
        assert!(count >= 1);
        assert!(candidates
            .get("ind")
            .is_some_and(|paths| paths.contains(&readable)));
    }

    #[test]
    fn special_files_do_not_break_the_entire_index() {
        let root = tempfile::tempdir().unwrap();
        let readable = root.path().join("readable.txt");
        let fifo = root.path().join("console");
        fs::write(&readable, "INDEX_SPECIAL_FILE_TOKEN\n").unwrap();
        let status = std::process::Command::new("mkfifo")
            .arg(&fifo)
            .status()
            .unwrap();
        assert!(status.success());

        let mut roots = BTreeMap::new();
        roots.insert("home".to_string(), vec![root.path().to_path_buf()]);
        let (count, candidates) = build_index(&roots, &[], 0).unwrap();

        assert_eq!(count, 1);
        assert!(candidates
            .get("ind")
            .is_some_and(|paths| paths.contains(&readable)));
    }
}
