use tauri::path::BaseDirectory;
use tauri::Manager;

/// Run the initialization stacks in "extra/*.stack"
pub fn load_stacks(
    app: &tauri::AppHandle,
    stack_start: impl Fn(&str) -> String,
) -> Result<(), String> {
    log::info!("Loading stacks");
    let directory = app
        .path()
        .resolve("extra", BaseDirectory::Resource)
        .unwrap();
    for entry in directory.read_dir().unwrap() {
        let path = entry.unwrap().path();
        if path.extension().and_then(|ext| ext.to_str()) == Some("stack") {
            let path_str = path.display().to_string();
            log::info!("Running initialization stack: {:#?}", path_str);
            stack_start(&path_str);
        }
    }

    Ok(())
}
