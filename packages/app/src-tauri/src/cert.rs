use std::path::Path;
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::Manager;

pub fn trust_certificate(app: &tauri::AppHandle) -> Result<(), String> {
    let script_path = app
        .path()
        .resolve("scripts/trust-cert.sh", BaseDirectory::Resource)
        .unwrap();

    // Check if the script exists
    if !Path::new(&script_path).exists() {
        log::error!("Script not found: {:?}", script_path);
        return Err(format!("Script not found: {:?}", script_path));
    }

    // Trust the certificate
    log::info!("Adding certificate to keychain");
    log::debug!("Executing script: {:?}", script_path);
    let output = Command::new("sh")
        .arg(script_path)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if !output.status.success() {
        log::error!(
            "Failed to add certificate to keychain: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        return Err(format!(
            "Failed to add certificate to keychain: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // // Add to keychain
    // log::info!("Adding certificate to keychain");
    // let output = Command::new("sudo")
    //     .args([
    //         "security",
    //         "add-trusted-cert",
    //         "-d",
    //         "-r",
    //         "trustRoot",
    //         "-k",
    //         "/Library/Keychains/System.keychain",
    //         cert_path.to_str().unwrap(),
    //     ])
    //     .output()
    //     .map_err(|e| format!("Failed to execute command: {}", e))?;

    // if !output.status.success() {
    //     log::error!(
    //         "Failed to add certificate to keychain: {}",
    //         String::from_utf8_lossy(&output.stderr)
    //     );
    //     return Err(format!(
    //         "Failed to add certificate to keychain: {}",
    //         String::from_utf8_lossy(&output.stderr)
    //     ));
    // }

    Ok(())
}
