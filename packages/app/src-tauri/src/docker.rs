use bollard::models::ContainerSummary;
use bollard::network::ListNetworksOptions;
use bollard::Docker;
use bollard::{container::ListContainersOptions, secret::Network};
use std::collections::HashSet;
use std::default::Default;
use std::time::Duration;
use tauri::{command, Emitter};
use tokio;

const REFRESH_INTERVAL: u64 = 5_000; // 2 seconds

// Common function to get Docker client
async fn get_docker() -> Result<Docker, String> {
    Docker::connect_with_local_defaults().map_err(|e| e.to_string())
}

// Common function to list containers
async fn get_containers(docker: &Docker) -> Result<Vec<ContainerSummary>, String> {
    let options = Some(ListContainersOptions::<String> {
        all: true,
        ..Default::default()
    });

    docker
        .list_containers(options)
        .await
        .map_err(|e| e.to_string())
}

// Utility to extract projects from containers
fn extract_projects(containers: &[ContainerSummary]) -> HashSet<String> {
    containers
        .iter()
        .filter_map(|container| {
            container
                .labels
                .as_ref()
                .and_then(|labels| labels.get("com.docker.compose.project").cloned())
        })
        .collect()
}

#[command]
pub async fn list_stacks() -> Result<Vec<String>, String> {
    let docker = get_docker().await?;
    let containers = get_containers(&docker).await?;
    let mut stacks: Vec<String> = extract_projects(&containers).into_iter().collect();
    stacks.sort();
    Ok(stacks)
}

#[command]
pub async fn list_containers() -> Result<Vec<ContainerSummary>, String> {
    println!("list_containers");
    let docker = get_docker().await?;
    let mut containers = get_containers(&docker).await?;
    // Sort labels for each container
    for container in &mut containers {
        if let Some(labels) = &mut container.labels {
            let sorted_labels = labels.clone();
            let mut keys: Vec<_> = sorted_labels.keys().cloned().collect();
            keys.sort();
            let sorted: std::collections::BTreeMap<_, _> = keys
                .into_iter()
                .map(|k| (k.clone(), sorted_labels.get(&k).unwrap().clone()))
                .collect();
            *labels = sorted.into_iter().collect();
        }
    }
    Ok(containers)
}

#[command]
pub async fn list_networks() -> Result<Vec<Network>, String> {
    println!("list_networks");
    let docker = get_docker().await?;
    let options = Some(ListNetworksOptions::<String> {
        ..Default::default()
    });
    docker
        .list_networks(options)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn docker_events(app_handle: tauri::AppHandle) -> Result<(), String> {
    let docker = get_docker().await?;
    let mut last_hash = String::new();

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(REFRESH_INTERVAL));

        loop {
            interval.tick().await;
            // Handle containers
            match get_containers(&docker).await {
                Ok(containers) => {
                    // Only emit if data changed
                    let new_hash = format!("{:?}", containers);
                    if new_hash != last_hash {
                        last_hash = new_hash;
                        let payload = (String::from("docker:containers"), &containers);
                        if let Err(e) = app_handle.emit("docker:containers", payload) {
                            eprintln!("Failed to emit containers event: {}", e);
                        }
                        // Extract and emit stacks with event name
                        let stacks: Vec<String> =
                            extract_projects(&containers).into_iter().collect();
                        let payload = (String::from("docker:stacks"), stacks);
                        if let Err(e) = app_handle.emit("docker:stacks", payload) {
                            eprintln!("Failed to emit stacks event: {}", e);
                        }

                        // Emit networks
                        let payload = (
                            String::from("docker:networks"),
                            list_networks().await.unwrap(),
                        );
                        if let Err(e) = app_handle.emit("docker:networks", payload) {
                            eprintln!("Failed to emit networks event: {}", e);
                        }
                    }
                }
                Err(e) => eprintln!("Failed to connect to Docker: {}", e),
            }
        }
    });

    Ok(())
}
