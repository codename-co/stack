use crate::cli;
use actix_cors::Cors;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Result};
use log::debug;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use serde::Deserialize;
use tauri::{path::BaseDirectory, AppHandle, Manager};

#[get("/")]
async fn index() -> String {
    format!("Stack API")
}

#[get("/health")]
async fn health() -> String {
    debug!("Health check");
    println!("Health check");
    format!("OK")
}

struct AppState {
    tauri: AppHandle,
}

#[derive(Deserialize)]
struct RunInput {
    slug: String,
}

#[post("/run")]
async fn run(input: web::Json<RunInput>) -> HttpResponse {
    let slug = input.slug.clone();
    log::info!("Opening stack file: {:#?}", slug);
    println!("Running {}!", slug);

    // Create a channel for streaming output
    let (tx, mut rx) = tokio::sync::mpsc::channel(100);

    // Spawn the CLI command in a separate task
    tokio::spawn(async move {
        let output_callback = Box::new(move |line: String| {
            let tx = tx.clone();
            tokio::spawn(async move {
                let _ = tx.send(line).await;
            });
        });

        cli::run_with_callback(&slug, output_callback).await;
    });

    // Create a streaming response
    HttpResponse::Ok()
        .content_type("text/event-stream")
        .streaming(Box::pin(async_stream::stream! {
          while let Some(line) = rx.recv().await {
            yield Ok::<_, actix_web::Error>(web::Bytes::from(format!("{}\n", line)));
          }
        }))
}

#[actix_web::main]
pub async fn init(tauri: AppHandle) -> std::io::Result<()> {
    log::info!("Initializing API");

    let app_data = web::Data::new(AppState {
        tauri: tauri.clone(),
    });

    // Load SSL keys
    let mut builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();

    let key_path = tauri
        .app_handle()
        .path()
        .resolve("certs/key.pem", BaseDirectory::Resource)
        .unwrap();
    builder
        .set_private_key_file(&key_path, SslFiletype::PEM)
        .map_err(|e| {
            log::error!("Failed to set private key file: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, e)
        })?;
    log::debug!("Private key file set successfully");

    let cert_path = tauri
        .app_handle()
        .path()
        .resolve("certs/cert.pem", BaseDirectory::Resource)
        .unwrap();
    builder.set_certificate_chain_file(cert_path).map_err(|e| {
        log::error!("Failed to set certificate chain file: {}", e);
        std::io::Error::new(std::io::ErrorKind::Other, e)
    })?;
    log::debug!("Certificate chain file set successfully");

    let http_server = HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin_fn(|origin, _req_head| {
                origin.to_str().map_or(false, |orig| {
                    debug!("Origin: {:?}", orig);
                    ["https://stack.lol", "http://localhost:4321"].contains(&orig)
                })
            })
            // .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        App::new()
            .app_data(app_data.clone())
            .wrap(cors)
            .service(index)
            .service(health)
            .service(run)
    })
    .bind_openssl("0.0.0.0:57404", builder)?
    .run();

    log::info!("Server started at https://0.0.0.0:57404");
    println!("Server started at https://0.0.0.0:57404");

    http_server.await
}
