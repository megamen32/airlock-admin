use grepmesh::{
    backend::{LocalBackend, SearchMode},
    config::LimitsConfig,
};
use std::{collections::BTreeMap, fs};

#[tokio::test]
async fn search_modes_and_globs_preserve_match_metadata() {
    let root = tempfile::tempdir().unwrap();
    fs::create_dir_all(root.path().join("ignored")).unwrap();
    fs::write(
        root.path().join("config.rs"),
        "prefix CUDA_BROKER_URL suffix\ncuda_broker_url\n",
    )
    .unwrap();
    fs::write(root.path().join("ignored/config.rs"), "CUDA_BROKER_URL\n").unwrap();

    let backend = LocalBackend::new("A", root.path(), Default::default())
        .with_excludes(vec!["**/ignored/**".into()]);
    let literal = backend
        .search_text(
            "CUDA_BROKER_URL",
            10,
            0,
            SearchMode::Literal,
            vec!["**/*.rs".into()],
            vec![],
        )
        .await
        .unwrap();
    assert_eq!(literal.len(), 1);
    assert_eq!(literal[0].text, "prefix CUDA_BROKER_URL suffix");
    assert_eq!(literal[0].column, 8);

    let insensitive = backend
        .search_text(
            "cuda_broker_url",
            10,
            0,
            SearchMode::CaseInsensitiveLiteral,
            vec!["**/*.rs".into()],
            vec![],
        )
        .await
        .unwrap();
    assert_eq!(insensitive.len(), 2);

    let regex = backend
        .search_text(
            "CUDA_.*URL",
            10,
            0,
            SearchMode::Regex,
            vec!["**/*.rs".into()],
            vec![],
        )
        .await
        .unwrap();
    assert_eq!(regex.len(), 1);
    assert_eq!(regex[0].column, 1);
}

#[tokio::test]
async fn named_roots_are_selectable_and_paths_remain_absolute() {
    let home = tempfile::tempdir().unwrap();
    let opt = tempfile::tempdir().unwrap();
    fs::write(home.path().join("home.txt"), "home-only\n").unwrap();
    fs::write(opt.path().join("opt.txt"), "opt-only\n").unwrap();
    let mut roots = BTreeMap::new();
    roots.insert("home".into(), vec![home.path().to_path_buf()]);
    roots.insert("opt".into(), vec![opt.path().to_path_buf()]);
    let backend = LocalBackend::new("A", home.path(), Default::default()).with_named_roots(roots);

    let selected = backend
        .search_text(
            "opt-only",
            10,
            0,
            SearchMode::Literal,
            vec![],
            vec!["opt".into()],
        )
        .await
        .unwrap();
    assert_eq!(selected.len(), 1);
    assert_eq!(
        selected[0].path,
        opt.path().join("opt.txt").display().to_string()
    );

    let unknown = backend
        .search_text(
            "home-only",
            10,
            0,
            SearchMode::Literal,
            vec![],
            vec!["missing".into()],
        )
        .await;
    assert!(unknown.is_err());
}

#[tokio::test]
async fn rg_search_sees_files_created_after_backend_construction() {
    let home = tempfile::tempdir().unwrap();
    let opt = tempfile::tempdir().unwrap();
    let mut roots = BTreeMap::new();
    roots.insert("home".into(), vec![home.path().to_path_buf()]);
    roots.insert("opt".into(), vec![opt.path().to_path_buf()]);

    let backend = LocalBackend::new("A", home.path(), Default::default()).with_named_roots(roots);
    fs::write(
        opt.path().join("created-after-start.txt"),
        "fresh-rg-content\n",
    )
    .unwrap();
    let status = backend.status().unwrap();
    assert_eq!(status.backend, "rg");
    let hits = backend
        .search_text(
            "fresh-rg-content",
            10,
            0,
            SearchMode::Literal,
            vec![],
            vec!["opt".into()],
        )
        .await
        .unwrap();
    assert_eq!(hits.len(), 1);
    assert_eq!(hits[0].host_id, "A");
}

#[tokio::test]
async fn rg_search_stops_after_the_requested_match_limit() {
    let root = tempfile::tempdir().unwrap();
    let content = (0..128)
        .map(|line| format!("MATCH_LIMIT_TOKEN_{line}\n"))
        .collect::<String>();
    fs::write(root.path().join("many-matches.txt"), content).unwrap();

    let backend = LocalBackend::new("A", root.path(), Default::default());
    let hits = backend
        .search_text(
            "MATCH_LIMIT_TOKEN",
            3,
            0,
            SearchMode::Literal,
            vec![],
            vec![],
        )
        .await
        .unwrap();
    assert_eq!(hits.len(), 3);
}

#[tokio::test]
async fn rg_byte_bound_is_reported_as_truncated() {
    let root = tempfile::tempdir().unwrap();
    let content = (0..128)
        .map(|line| format!("BYTE_BOUND_TOKEN_{line}\n"))
        .collect::<String>();
    fs::write(root.path().join("many-matches.txt"), content).unwrap();

    let limits = LimitsConfig {
        max_response_bytes: 64,
        ..Default::default()
    };
    let backend = LocalBackend::new("A", root.path(), limits);
    let outcome = backend
        .search_text_bounded(
            "BYTE_BOUND_TOKEN",
            100,
            0,
            SearchMode::Literal,
            vec![],
            vec![],
        )
        .await
        .unwrap();
    assert!(outcome.truncated);
    assert!(outcome.hits.len() < 100);
}

#[tokio::test]
async fn rg_path_search_is_bounded_and_reports_truncation() {
    let root = tempfile::tempdir().unwrap();
    for file in 0..128 {
        fs::write(root.path().join(format!("candidate-{file}.txt")), "path\n").unwrap();
    }

    let limits = LimitsConfig {
        max_response_bytes: 64,
        ..Default::default()
    };
    let backend = LocalBackend::new("A", root.path(), limits);
    let outcome = backend
        .find_paths_bounded("candidate-", 100, vec![])
        .await
        .unwrap();
    assert!(outcome.truncated);
    assert!(outcome.hits.len() < 100);
}
