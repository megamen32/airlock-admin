use crate::backend::IndexState;
use globset::{Glob, GlobSet, GlobSetBuilder};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    collections::{BTreeMap, BTreeSet, VecDeque},
    fs,
    io::ErrorKind,
    os::unix::fs::MetadataExt,
    path::{Path, PathBuf},
    sync::{mpsc, Arc, RwLock},
    thread,
    time::Duration,
};

type IndexMap = BTreeMap<String, BTreeSet<PathBuf>>;
type DirectoryScan = (usize, IndexMap, Vec<PathBuf>);

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
    ready_roots: Arc<RwLock<BTreeSet<PathBuf>>>,
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
        let ready_roots = Arc::new(RwLock::new(BTreeSet::new()));
        let ready_root_state = Arc::clone(&ready_roots);
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
            for root in ordered_roots(&roots) {
                let _ = watcher.watch(&root, RecursiveMode::Recursive);
            }
            let mut generation = 0;
            let mut rebuild = || {
                rebuild_index(
                    &roots,
                    &excludes,
                    max_file_bytes,
                    &state,
                    &candidate_state,
                    &ready_root_state,
                    &mut generation,
                )
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
            ready_roots,
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
        if !self
            .ready_roots
            .read()
            .ok()
            .is_some_and(|roots| roots.iter().any(|ready| root.starts_with(ready)))
        {
            return None;
        }
        let grams = trigrams(&query.to_ascii_lowercase());
        if grams.is_empty() {
            return None;
        }
        let map = self.candidates.read().ok()?;
        let mut sets = grams.iter().map(|gram| map.get(gram));
        let first = sets.next()?.cloned()?;
        let result: Vec<_> = sets
            .try_fold(first, |acc, set| {
                set.map(|set| acc.intersection(set).cloned().collect())
            })?
            .into_iter()
            .filter(|path| path.starts_with(root))
            .collect();
        Some(result)
    }
}

fn rebuild_index(
    roots: &BTreeMap<String, Vec<PathBuf>>,
    excludes: &[String],
    max_file_bytes: u64,
    state: &Arc<RwLock<IndexSnapshot>>,
    candidates: &Arc<RwLock<BTreeMap<String, BTreeSet<PathBuf>>>>,
    ready_roots: &Arc<RwLock<BTreeSet<PathBuf>>>,
    generation: &mut u64,
) {
    let matcher = match compile_excludes(excludes) {
        Ok(matcher) => matcher,
        Err(error) => {
            if let Ok(mut current) = state.write() {
                current.state = IndexState::Degraded;
                current.last_error = Some(error);
                current.generation = generation.saturating_add(1);
            }
            return;
        }
    };
    let mut count = 0;
    if let Ok(mut current) = state.write() {
        current.state = IndexState::Building;
        current.indexed_files = 0;
        current.last_error = None;
    }
    if let Ok(mut map) = candidates.write() {
        map.clear();
    }
    if let Ok(mut ready) = ready_roots.write() {
        ready.clear();
    }
    for root in ordered_roots(roots) {
        let mut units: VecDeque<_> = match root_units(&root) {
            Ok(units) => units.into(),
            Err(error) => {
                if let Ok(mut current) = state.write() {
                    current.state = IndexState::Degraded;
                    current.last_error = Some(error);
                    current.generation = generation.saturating_add(1);
                }
                return;
            }
        };
        while let Some(unit) = units.pop_front() {
            let result = scan_directory_unit(&unit, &root, &matcher, max_file_bytes);
            let (unit_count, next, children) = match result {
                Ok(result) => result,
                Err(error) => {
                    if let Ok(mut current) = state.write() {
                        current.state = IndexState::Degraded;
                        current.last_error = Some(error);
                        current.generation = generation.saturating_add(1);
                    }
                    return;
                }
            };
            if let Ok(mut map) = candidates.write() {
                for (gram, paths) in next {
                    map.entry(gram).or_default().extend(paths);
                }
            }
            units.extend(children);
            count += unit_count;
            *generation += 1;
            if let Ok(mut current) = state.write() {
                current.indexed_files = count;
                current.generation = *generation;
            }
        }
        if let Ok(mut ready) = ready_roots.write() {
            ready.insert(root);
        }
    }
    if let Ok(mut current) = state.write() {
        current.state = IndexState::Ready;
        current.last_error = None;
    }
}

#[cfg(test)]
fn build_root_index(
    root: &Path,
    excludes: &[String],
    max_file_bytes: u64,
) -> Result<(usize, BTreeMap<String, BTreeSet<PathBuf>>), String> {
    let matcher = compile_excludes(excludes)?;
    let root_device = fs::symlink_metadata(root)
        .map_err(|error| format!("{}: {error}", root.display()))?
        .dev();
    let mut map = BTreeMap::new();
    let count = walk(
        &root.to_path_buf(),
        root,
        root_device,
        &matcher,
        max_file_bytes,
        &mut map,
    )?;
    Ok((count, map))
}

fn scan_directory_unit(
    unit: &Path,
    root: &Path,
    excludes: &GlobSet,
    max_file_bytes: u64,
) -> Result<DirectoryScan, String> {
    let root_device = fs::symlink_metadata(root)
        .map_err(|error| format!("{}: {error}", root.display()))?
        .dev();
    let mut map = BTreeMap::new();
    let metadata = match fs::symlink_metadata(unit) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::PermissionDenied => {
            return Ok((0, map, Vec::new()))
        }
        Err(error) => return Err(format!("{}: {error}", unit.display())),
    };
    if metadata.dev() != root_device
        || metadata.file_type().is_symlink()
        || excluded(unit, root, excludes)
    {
        return Ok((0, map, Vec::new()));
    }
    if metadata.is_file() {
        let count = walk(
            &unit.to_path_buf(),
            root,
            root_device,
            excludes,
            max_file_bytes,
            &mut map,
        )?;
        return Ok((count, map, Vec::new()));
    }
    if !metadata.is_dir() {
        return Ok((0, map, Vec::new()));
    }
    let children = match fs::read_dir(unit) {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok().map(|entry| entry.path()))
            .collect(),
        Err(error) if error.kind() == ErrorKind::PermissionDenied => Vec::new(),
        Err(error) => return Err(format!("{}: {error}", unit.display())),
    };
    Ok((0, map, children))
}

fn root_units(root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut units: Vec<_> = fs::read_dir(root)
        .map_err(|error| format!("{}: {error}", root.display()))?
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .collect();
    units.sort_by_key(|path| {
        let name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default();
        (name != ".grepmesh-canary", path.clone())
    });
    Ok(units)
}

fn ordered_roots(roots: &BTreeMap<String, Vec<PathBuf>>) -> Vec<PathBuf> {
    let mut ordered = Vec::new();
    let mut seen = BTreeSet::new();
    for name in ["home", "opt", "etc", "local"] {
        if let Some(paths) = roots.get(name) {
            for path in paths {
                if seen.insert(path.clone()) {
                    ordered.push(path.clone());
                }
            }
        }
    }
    for paths in roots.values() {
        for path in paths {
            if seen.insert(path.clone()) {
                ordered.push(path.clone());
            }
        }
    }
    ordered
}

fn walk(
    path: &PathBuf,
    root: &Path,
    root_device: u64,
    excludes: &GlobSet,
    max_file_bytes: u64,
    map: &mut BTreeMap<String, BTreeSet<PathBuf>>,
) -> Result<usize, String> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::PermissionDenied => return Ok(0),
        Err(error) => return Err(format!("{}: {error}", path.display())),
    };
    if metadata.dev() != root_device {
        return Ok(0);
    }
    if metadata.file_type().is_symlink() {
        return Ok(0);
    }
    if excluded(path, root, excludes) {
        return Ok(0);
    }
    if metadata.is_file() {
        if max_file_bytes != 0 && metadata.len() > max_file_bytes {
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
        count += walk(
            &entry.path(),
            root,
            root_device,
            excludes,
            max_file_bytes,
            map,
        )?;
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
    let matches = |candidate: &Path| {
        excludes.is_match(candidate)
            || candidate
                .strip_prefix(root)
                .map(|relative| excludes.is_match(relative))
                .unwrap_or(false)
    };
    matches(path) || matches(&path.join(".grepmesh-directory-probe"))
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
        let result = build_root_index(root.path(), &[], 0);

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
        let (count, candidates) = build_root_index(root.path(), &[], 0).unwrap();

        assert_eq!(count, 1);
        assert!(candidates
            .get("ind")
            .is_some_and(|paths| paths.contains(&readable)));
    }

    #[test]
    fn roots_prioritize_home_before_other_named_roots() {
        let mut roots = BTreeMap::new();
        roots.insert("etc".to_string(), vec![PathBuf::from("/etc")]);
        roots.insert("home".to_string(), vec![PathBuf::from("/home/roomhacker")]);
        roots.insert("opt".to_string(), vec![PathBuf::from("/opt")]);
        assert_eq!(
            ordered_roots(&roots),
            vec![
                PathBuf::from("/home/roomhacker"),
                PathBuf::from("/opt"),
                PathBuf::from("/etc"),
            ]
        );
    }

    #[test]
    fn directory_exclusion_prunes_the_directory_itself() {
        let root = PathBuf::from("/workspace");
        let matcher = compile_excludes(&["**/.cache/**".to_string()]).unwrap();
        assert!(excluded(&root.join(".cache"), &root, &matcher));
    }
}
