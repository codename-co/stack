use crate::tls;
use std::path::Path;
use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

pub fn trust_certificate(app: &tauri::AppHandle) -> Result<(), String> {
    // The script trusts the per-install certificate from the app data
    // directory. Make sure it has been generated before handing the user a
    // Terminal window that can only fail.
    let cert_path = tls::cert_dir(app)?.join("cert.pem");
    if !cert_path.exists() {
        log::error!("Local certificate not found: {:?}", cert_path);
        return Err(format!(
            "Local certificate not generated yet: {:?}",
            cert_path
        ));
    }

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

    app.opener()
        .open_path(
            script_path.to_string_lossy().to_string(),
            Some("Terminal.app"),
        )
        .map_err(|e| format!("Failed to execute command: {}", e))?;

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
