use crate::types::Flavor;
use crate::utils::download_file;
use flate2::{read::MultiGzDecoder, Compression, GzBuilder};
use ignore::WalkBuilder;
use log::{debug, error, info, warn};
use reqwest;
use std::env;
use std::fs::{self, File};
use std::io::BufRead;
use std::path::Path;
use std::path::PathBuf;
use std::process::Command;
use tar::Archive;
use tempfile::tempdir;

/// Collects environment variables to pass to the container
fn get_docker_env_vars() -> Vec<(String, String)> {
    let mut env_vars = Vec::new();

    // Add some useful default variables
    env_vars.push(("DOCKER_BUILDKIT".to_string(), "1".to_string()));

    // Add PATH with some useful directories
    let mut env_path = env::var("PATH").unwrap_or_default();
    // TODO: sidecar docker binaries instead of relying on external ones
    env_path.push_str(":~/.docker/bin:~/.orbstack/bin/docker:/Applications/OrbStack.app/Contents/MacOS/xbin:/Applications/Docker.app/Contents/Resources/bin");
    info!("Adding PATH: {}", env_path);
    env_vars.push(("PATH".to_string(), env_path));

    // Pass through specific environment variables from host
    for (key, value) in env::vars() {
        // Pass through variables starting with specific prefixes
        if key.starts_with("STACK_") {
            info!("Adding variable: {}={}", key, value);
            env_vars.push((key, value));
        }
    }

    debug!("Environment variables: {:?}", env_vars);
    env_vars
}

/// Creates a tar archive from a directory
fn create_archive(source_path: &Path, output_path: &Path) -> std::io::Result<()> {
    info!("📦 Crafting your stack bundle: {:?}", output_path);
    let file = File::create(output_path)?;

    // Create gzip encoder with maximum compression
    let gz = GzBuilder::new()
        .filename(output_path.to_str().unwrap_or("stack.stack"))
        .comment("Stack bundle")
        .write(file, Compression::best());

    let mut builder = tar::Builder::new(gz);

    // Configure git-ignore based walker with explicit git directory exclusion
    let walker = WalkBuilder::new(source_path)
        .hidden(false) // Include hidden files
        .git_ignore(true) // Use .gitignore files
        .git_global(true) // Use global gitignore
        .git_exclude(true) // Use .git/info/exclude
        .require_git(false) // Don't require it to be a git repo
        .ignore(true) // Use .ignore files
        .filter_entry(|entry| !entry.path().starts_with(".git/")) // Explicitly filter out .git directory
        .build();

    // Custom ignore for .stack files and .git directory
    let should_include = |path: &Path| {
        path.extension().map(|ext| ext != "stack").unwrap_or(true)
            && !path.starts_with(".git")
            && !path.components().any(|c| c.as_os_str() == ".git")
    };

    // Walk the directory and add files to archive
    for entry in walker {
        let entry = entry.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        let path = entry.path();

        // Skip if it's not a file or if it's a .stack file
        if !path.is_file() || !should_include(path) {
            continue;
        }

        debug!("Adding: {:?}", path);

        let rel_path = path
            .strip_prefix(source_path)
            .expect("Failed to strip prefix");

        builder.append_path_with_name(path, rel_path)?;
    }

    builder.finish()?;
    Ok(())
}

/// Packs a software stack into a stack bundle.
///
/// # Arguments
///
/// * `source` - A string slice that holds the path to the source directory.
pub fn pack(source: &str) {
    println!("4");
    let source_path = if source == "." {
        env::current_dir().expect("Failed to get current directory")
    } else {
        std::path::PathBuf::from(source)
    };

    debug!("Source: {:?}", source_path);

    // Update output filename to include .gz extension
    let output_name = source_path
        .file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new("stack"))
        .to_string_lossy()
        .to_string();
    let output_path = std::path::PathBuf::from(format!("{}.stack", output_name));

    // Create the archive
    match create_archive(&source_path, &output_path) {
        Ok(()) => info!("✅ Stack bundle packed: {:?}", output_path),
        Err(e) => error!("Failed to create stack bundle: {e}"),
    }
}

/// Runs a software stack from a stack bundle.
///
/// # Arguments
///
/// * `bundle` - A string slice that holds the path to the stack bundle file.
pub async fn run(bundle: &str) {
    let bundle_path = if bundle.starts_with("http://")
        || bundle.starts_with("https://")
        || bundle.starts_with("file://")
    {
        debug!("Downloading bundle: {}", bundle);

        download_file(bundle)
            .await
            .expect("Failed to download bundle file")
    } else {
        PathBuf::from(bundle)
    };

    debug!("bundle_path: {:?}", bundle_path);

    // Check if file exists before proceeding
    if !bundle_path.exists() {
        error!("Bundle file not found: {:?}", bundle_path);
        return;
    }

    let file = match File::open(&bundle_path) {
        Ok(f) => f,
        Err(e) => {
            error!("Failed to open bundle file: {}", e);
            return;
        }
    };

    debug!("Reading stack file: {:?}", file);
    let gz = MultiGzDecoder::new(file);
    let temp_dir = tempdir().expect("Failed to create temp dir").into_path();

    // Use a subdirectory to keep things cleaner
    let extract_dir = temp_dir.join("bundle_extract");
    debug!("Extracting to: {:?}", extract_dir);
    if let Err(e) = fs::create_dir_all(&extract_dir) {
        error!("Failed to create extract directory: {:?}", e);
        return;
    }

    let mut archive = Archive::new(gz);
    if let Err(e) = archive.unpack(&extract_dir) {
        error!("Failed to unpack bundle: {:?}", e);
        return;
    }
    debug!("Extraction complete: {:?}", extract_dir);

    // Now we can access the metadata file
    let config_path = extract_dir.join("stack.yaml");
    debug!("Loading stack metadata from: {:?}", config_path);
    let config = load_stack_manifest(config_path.as_path());

    debug!("Stack metadata: {:?}", config);

    // Get the stack name from the original filename without .stack extension
    let bundle_name = config["slug"]
        .as_str()
        .unwrap_or(bundle.split('.').next().unwrap().split('/').last().unwrap());

    // must consist only of lowercase alphanumeric characters, hyphens, and underscores as well as start with a letter or number
    let bundle_name: String = bundle_name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>()
        .to_lowercase();

    debug!("bundle_name: {:?}", bundle_name);

    let flavor = if let Some(flavor) = guess_flavor(&extract_dir) {
        flavor
    } else {
        error!("Failed to determine the flavor of the software stack.");
        return;
    };
    debug!("Detected flavor: {:?}", flavor);

    run_stack(&bundle_name, &extract_dir, flavor, |line| {
        println!("{}", line);
    });

    // fs::remove_dir_all(temp_dir).expect("Failed to remove temp dir");
}

/// Runs a software stack from a stack bundle.
///
/// # Arguments
///
/// * `bundle` - A string slice that holds the path to the stack bundle file.
/// * `callback` - A callback function that receives output lines.
pub async fn run_with_callback(bundle: &str, callback: impl Fn(String)) {
    callback("Initializing stack…".to_string());

    let bundle_path = if bundle.starts_with("http://")
        || bundle.starts_with("https://")
        || bundle.starts_with("file://")
    {
        debug!("Downloading bundle: {}", bundle);
        callback("Downloading…".to_string());

        download_file(bundle)
            .await
            .expect("Failed to download bundle file")
    } else {
        PathBuf::from(bundle)
    };

    debug!("bundle_path: {:?}", bundle_path);

    // Check if file exists before proceeding
    if !bundle_path.exists() {
        error!("Bundle file not found: {:?}", bundle_path);
        return;
    }

    let file = match File::open(&bundle_path) {
        Ok(f) => f,
        Err(e) => {
            error!("Failed to open bundle file: {}", e);
            return;
        }
    };

    debug!("Reading stack file: {:?}", file);
    let gz = MultiGzDecoder::new(file);
    let temp_dir = tempdir().expect("Failed to create temp dir").into_path();

    // Use a subdirectory to keep things cleaner
    let extract_dir = temp_dir.join("bundle_extract");
    debug!("Extracting to: {:?}", extract_dir);
    callback("Extracting…".to_string());
    if let Err(e) = fs::create_dir_all(&extract_dir) {
        error!("Failed to create extract directory: {:?}", e);
        return;
    }

    let mut archive = Archive::new(gz);
    if let Err(e) = archive.unpack(&extract_dir) {
        error!("Failed to unpack bundle: {:?}", e);
        return;
    }
    debug!("Extraction complete: {:?}", extract_dir);
    callback("Extraction complete".to_string());

    // Now we can access the metadata file
    let config_path = extract_dir.join("stack.yaml");
    debug!("Loading stack metadata from: {:?}", config_path);
    let config = load_stack_manifest(config_path.as_path());

    debug!("Stack metadata: {:?}", config);

    // Get the stack name from the original filename without .stack extension
    let bundle_name = config["slug"]
        .as_str()
        .unwrap_or(bundle.split('.').next().unwrap().split('/').last().unwrap());

    // must consist only of lowercase alphanumeric characters, hyphens, and underscores as well as start with a letter or number
    let bundle_name: String = bundle_name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>()
        .to_lowercase();

    debug!("bundle_name: {:?}", bundle_name);

    let flavor = if let Some(flavor) = guess_flavor(&extract_dir) {
        flavor
    } else {
        error!("Failed to determine the flavor of the software stack.");
        return;
    };
    debug!("Detected flavor: {:?}", flavor);
    callback("Detected flavor: ".to_string() + &format!("{:?}", flavor));

    run_stack(&bundle_name, &extract_dir, flavor, callback);

    // fs::remove_dir_all(temp_dir).expect("Failed to remove temp dir");
}

/// Stops a software stack from a stack bundle.
///
/// # Arguments
///
/// * `bundle` - A string slice that holds the path to the stack bundle file.
pub fn stop(bundle: &str) {
    let bundle_path = PathBuf::from(bundle);
    let bundle_name = bundle_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("stack");

    let file = File::open(bundle).expect("Failed to open bundle file");
    let gz = flate2::read::GzDecoder::new(file);
    let temp_dir = tempdir().expect("Failed to create temp dir").into_path();

    // Create a named subdirectory
    let extract_dir = temp_dir.join(bundle_name);
    fs::create_dir(&extract_dir).expect("Failed to create extract directory");

    debug!("Extracting to: {:?}", extract_dir);

    let mut archive = Archive::new(gz);
    archive
        .unpack(&extract_dir)
        .expect("Failed to unpack bundle");

    let flavor = if let Some(flavor) = guess_flavor(&extract_dir) {
        flavor
    } else {
        error!("Failed to determine the flavor of the software stack.");
        return;
    };
    debug!("Detected flavor: {:?}", flavor);

    stop_stack(&extract_dir, flavor);
}

fn load_stack_manifest(config_path: &Path) -> serde_yaml::Value {
    if config_path.exists() {
        let config_file = File::open(config_path).expect("Failed to open config file");
        let config: serde_yaml::Value =
            serde_yaml::from_reader(config_file).expect("Failed to parse config file");
        return config;
    } else {
        error!("No stack configuration file found in: {:?}", config_path);
    }
    serde_yaml::Value::Null
}

/// Inspects a software stack from a stack bundle.
///
/// # Arguments
///
/// * `bundle` - A string slice that holds the path to the stack bundle file.
pub fn inspect(bundle: &str) {
    let file = File::open(bundle).expect("Failed to open bundle file");
    let gz = flate2::read::GzDecoder::new(file);
    let dir = tempdir().expect("Failed to create temp dir");
    let mut archive = Archive::new(gz);
    archive.unpack(dir.path()).expect("Failed to unpack bundle");

    let guessed_flavor =
        guess_flavor(dir.path()).expect("Failed to determine the flavor of the software stack");
    debug!("Stack flavor: {:?}", guessed_flavor);

    let config_path = dir.path().join("stack.yaml");
    if config_path.exists() {
        let config = load_stack_manifest(config_path.as_path());

        debug!("Stack metadata: {:?}", config);

        info!("Stack metadata:");
        info!("  Slug: {}", config["slug"].as_str().unwrap_or("N/A"));
        info!("  Name: {}", config["name"].as_str().unwrap_or("N/A"));
        info!("  Flavor: {:?}", config["flavor"].as_str().unwrap_or("N/A"));
        info!("  Version: {}", config["version"].as_str().unwrap_or("N/A"));
        info!(
            "  Description: {}",
            config["description"].as_str().unwrap_or("N/A")
        );
        // info!("  Icon: {}", config["icon"].as_str().unwrap_or("N/A"));
        info!("  Author: {}", config["author"].as_str().unwrap_or("N/A"));
        info!("  License: {}", config["license"].as_str().unwrap_or("N/A"));
    } else {
        debug!("No stack configuration file found");
    }

    info!(
        "\nStack is ready to be run:\n\x1b[4mstack run {}\x1b[0m",
        bundle
    );
}

/// Guesses the flavor of the software stack by scanning the files available.
///
/// # Arguments
///
/// * `path` - A reference to the path of the extracted bundle directory.
///
/// # Returns
///
/// * `Option<Flavor>` - The guessed flavor of the software stack, or `None` if it could not be determined.
fn guess_flavor(path: &std::path::Path) -> Option<Flavor> {
    // list files
    let entries = list_root_files(path);
    for entry in entries {
        let file_name = entry.file_name().unwrap().to_str().unwrap();

        if file_name.eq("Chart.yaml") {
            return Some(Flavor::HelmChart);
        } else if [
            "compose.yaml",
            "compose.yml",
            "docker-compose.yaml",
            "docker-compose.yml",
        ]
        .iter()
        .any(|name: &&str| file_name.eq(*name))
        {
            return Some(Flavor::DockerCompose);
        } else if file_name.eq("Dockerfile") {
            return Some(Flavor::DockerService);
        } else if file_name.eq("package.json") {
            return Some(Flavor::NodePackage);
        } else if file_name.eq("go.mod") {
            return Some(Flavor::GoPackage);
        } else if ["index.html", "index.htm"]
            .iter()
            .any(|name| file_name.eq(*name))
        {
            return Some(Flavor::StaticWebsite);
        }
    }
    None
}

/// Lists only the files in the root of a directory (non-recursive).
///
/// # Arguments
///
/// * `path` - A reference to the directory path
///
/// # Returns
///
/// * `Vec<std::path::PathBuf>` - A vector of file paths
fn list_root_files(path: &std::path::Path) -> Vec<std::path::PathBuf> {
    fs::read_dir(path)
        .expect("Failed to read directory")
        .filter_map(|entry| {
            let entry = entry.expect("Failed to read entry");
            let path = entry.path();
            if path.is_file() {
                Some(path)
            } else {
                None
            }
        })
        .collect()
}

/// Runs a software stack from a stack bundle based on its flavor.
///
/// # Arguments
///
/// * `name` - The name of the software stack.
/// * `path` - A reference to the path of the extracted bundle directory.
/// * `flavor` - The flavor of the software stack.
/// * `callback` - A function to receive progress updates.
fn run_stack(name: &str, path: &Path, flavor: Flavor, callback: impl Fn(String)) {
    info!("Running flavor: {:?} in path: {:?}", flavor, path);

    // Collect environment variables
    let env_vars = get_docker_env_vars();

    match flavor {
        Flavor::DockerCompose => {
            let mut cmd = Command::new("docker");
            cmd.args([
                "compose",
                "--project-name",
                &name,
                "up",
                "-d",
                "--wait",
                "--remove-orphans",
            ])
            .current_dir(path)
            .envs(env_vars)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());
            debug!("> {:?}", cmd);
            callback(format!("Running command: {:?}", cmd));

            match cmd.spawn() {
                Ok(mut child) => {
                    let stdout = child.stdout.take().unwrap();
                    let stderr = child.stderr.take().unwrap();

                    // Stream stdout
                    let stdout_reader = std::io::BufReader::new(stdout);
                    for line in stdout_reader.lines() {
                        if let Ok(line) = line {
                            debug!("out: {}", line);
                            callback(format!("| {}", line));
                        }
                    }

                    // Stream stderr
                    let stderr_reader = std::io::BufReader::new(stderr);
                    for line in stderr_reader.lines() {
                        if let Ok(line) = line {
                            error!("err: {}", line);
                            callback(format!("| {}", line));
                        }
                    }

                    // Wait for completion
                    match child.wait() {
                        Ok(status) => {
                            if !status.success() {
                                error!("Docker compose failed with status: {}", status);
                                callback(format!("Docker compose failed with status: {}", status));
                            } else {
                                debug!("Docker compose completed successfully");
                                callback("Docker compose completed successfully".to_string());
                            }
                        }
                        Err(e) => {
                            error!("Failed to wait for docker compose: {}", e);
                            callback(format!("Failed to wait for docker compose: {}", e));
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to execute docker compose command: {}", e);
                    callback(format!("Failed to execute docker compose command: {}", e));
                }
            }
        }

        Flavor::DockerService => {
            // Prepare
            let mut clean_cmd = Command::new("docker");
            clean_cmd
                .arg("rm")
                .arg("-f")
                .arg(&format!("docker-{}", name))
                .current_dir(path);
            debug!("> {:?}", clean_cmd);

            let status = clean_cmd
                .status()
                .expect("Failed to execute docker build command");
            debug!("< {:?}", status);

            if !status.success() {
                error!("docker build command failed with status: {}", status);
                return;
            }

            // Build
            let mut build_cmd = Command::new("docker");
            build_cmd
                .arg("build")
                .args(["-t", "stack-service"])
                .arg(".")
                .current_dir(path)
                .envs(env_vars.clone());
            debug!("> {:?}", build_cmd);

            let status = build_cmd
                .status()
                .expect("Failed to execute docker build command");
            debug!("< {:?}", status);

            if !status.success() {
                error!("docker build command failed with status: {}", status);
                return;
            }

            debug!("> {:?}", build_cmd);

            // Run
            let mut run_cmd = Command::new("docker");
            run_cmd
                .arg("run")
                .arg("-d")
                .args(["--name", &format!("docker-{}", name)])
                // .args(["-p", "8080:8080"])
                .arg("stack-service")
                .current_dir(path)
                .envs(env_vars.clone());
            debug!("> {:?}", run_cmd);

            let status = run_cmd
                .status()
                .expect("Failed to execute docker run command");
            debug!("< {:?}", status);

            if !status.success() {
                error!("docker run command failed with status: {}", status);
            }

            debug!("> {:?}", run_cmd);
        }

        Flavor::StaticWebsite => {
            // Prepare
            // let mut clean_cmd = Command::new("docker");
            // clean_cmd
            //     .arg("rm")
            //     .arg("-f")
            //     .arg(&format!("static-{}", name))
            //     .current_dir(path);
            // debug!("> {:?}", clean_cmd);

            // let status = clean_cmd
            //     .status()
            //     .expect("Failed to execute docker build command");
            // debug!("< {:?}", status);

            // if !status.success() {
            //     error!("docker build command failed with status: {}", status);
            //     return;
            // }

            // debug!("> {:?}", clean_cmd);

            let assets_destination_path = path;
            // Copy static files into ~/.stacks/static-<name>
            // let assets_destination_path =
            //     shellexpand::tilde(&format!("~/.stack/{}/", name)).to_string();
            // let mut copy_cmd = Command::new("mkdir");
            // copy_cmd
            //     .args([&format!(
            //         "-p {} && cp -R {} {}",
            //         assets_destination_path,
            //         path.display(),
            //         assets_destination_path,
            //     )
            //     .as_str()])
            //     .current_dir(path)
            //     .envs(env_vars.clone());
            // debug!("> {:?}", copy_cmd);

            // Run
            let mut run_cmd = Command::new("docker");
            let host = format!("{}.stack.localhost", name);
            run_cmd
                .arg("run")
                .arg("-d")
                .args(["--name", &format!("static-{}", name)])
                // .args(["-p", ":80"])
                .args(["--label", &format!("dash.name={}", name)])
                .args(["--label", "dash.icon=html5"])
                .args(["--label", &format!("dash.url=https://{}", host)])
                .args([
                    "--label",
                    &format!("traefik.http.routers.{}.rule=Host(`{}`)", name, host),
                ])
                // .args(["--label", "traefik.http.services." + name + ".loadbalancer.server.port=80"])
                .args([
                    "-v",
                    &format!(
                        "{}:/usr/share/nginx/html:ro",
                        assets_destination_path.display()
                    )
                    .as_str(),
                ])
                .arg("nginx:stable-alpine")
                .current_dir(path)
                .envs(env_vars.clone());
            debug!("> {:?}", run_cmd);

            let status = run_cmd
                .status()
                .expect("Failed to execute docker run command");
            debug!("< {:?}", status);

            if !status.success() {
                error!("docker run command failed with status: {}", status);
            }
        }

        _ => {
            warn!("Running flavor {:?} is not supported yet.", flavor);
        }
    }

    info!("✅ Stack {} is running.", name);
}

/// Stops a software stack from a stack bundle based on its flavor.
///
/// # Arguments
///
/// * `path` - A reference to the path of the extracted bundle directory.
/// * `flavor` - The flavor of the software stack.
fn stop_stack(path: &Path, flavor: Flavor) {
    info!("Stopping flavor: {:?} in path: {:?}", flavor, path);

    // Collect environment variables
    let env_vars = get_docker_env_vars();

    match flavor {
        Flavor::DockerCompose => {
            let mut cmd = Command::new("docker");
            cmd.arg("compose")
                .arg("down")
                .current_dir(path)
                .envs(env_vars);

            let status = cmd
                .status()
                .expect("Failed to execute docker compose command");

            if !status.success() {
                error!("docker compose command failed with status: {}", status);
            }
        }

        _ => {
            info!("Stopping flavor {:?} is not supported yet.", flavor);
        }
    }
}
