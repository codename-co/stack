use reqwest;
use std::fs::File;
use std::path::PathBuf;

// use flate2::read::MultiGzDecoder;
// use std::fs::{self, File};
// use std::io::Result;
// use std::path::{Path, PathBuf};
// use tar::Archive;
// use tempfile::tempdir;

/// Downloads a file from a URI and saves it to a temporary location.
///
/// # Arguments
///
/// * `uri` - A string slice that holds the URI of the file.
///
/// # Returns
///
/// * `PathBuf` - The path to the downloaded file.
pub async fn download_file(uri: &str) -> std::io::Result<PathBuf> {
    let response = reqwest::get(uri).await.expect("Failed to download file");
    let temp_file = tempfile::NamedTempFile::new()?;
    let temp_path = temp_file.path().to_owned();
    let mut file = File::create(&temp_path)?;
    let bytes = response.bytes().await.expect("Failed to read response");
    std::io::copy(&mut bytes.as_ref(), &mut file)?;

    // Get a random filename in the temp directory using timestamp
    let temp_dir = std::env::temp_dir();
    let filename = temp_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("stack");
    let final_path = temp_dir.join(filename);

    // Persist the file to the new location
    temp_file.persist(&final_path)?;
    Ok(final_path)
}

// /// Inflates a stack bundle file into a temporary directory.
// pub fn inflate_bundle(stack_file: &Path) -> Result<PathBuf> {
//     let file = File::open(stack_file)?;
//     let gz = MultiGzDecoder::new(file);
//     let temp_dir = tempdir()?;
//     let extract_dir = temp_dir.path().join("bundle_extract");
//     fs::create_dir_all(&extract_dir)?;

//     let mut archive = Archive::new(gz);
//     archive.unpack(&extract_dir)?;

//     Ok(extract_dir)
// }

// /// Creates a stack folder by name in the specified base directory.
// fn create_stack_folder(name: &str) -> Result<PathBuf> {
//     let stack_folder = shellexpand::tilde(&format!("~/.stack/{}/", name)).to_string();

//     fs::create_dir_all(&stack_folder)?;
//     Ok(stack_folder)
// }

// /// Unpack a stack file into a temporary directory and returns the path to the extracted directory.
// pub fn unpack_bundle(stack_file: &Path) -> Result<()> {
//     let file = File::open(stack_file)?;
//     let gz = MultiGzDecoder::new(file);

//     let extract_dir = create_stack_folder("test")?;

//     let mut archive = Archive::new(gz);
//     archive.unpack(&extract_dir)?;

//     Ok(())
// }
