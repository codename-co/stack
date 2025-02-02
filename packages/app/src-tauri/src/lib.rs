// use once_cell::sync::Lazy;
// use std::sync::Mutex;
use init::load_stacks;
use std::thread;
use tauri::{AppHandle, Emitter};
use tauri_plugin_cli::CliExt;
// use tauri_plugin_positioner::{Position, WindowExt};

mod api;
mod cert;
mod cli;
mod docker;
mod init;
// mod menu_plugin;
mod tray;
mod types;
mod updater;

// static MAIN_WINDOW: Lazy<Mutex<Option<WebviewWindow>>> = Lazy::new(|| Mutex::new(None));
// static APP: Lazy<Mutex<Option<tauri::AppHandle>>> = Lazy::new(|| Mutex::new(None));

// #[cfg(target_os = "macos")]
// pub struct AppMenu<R: Runtime>(pub std::sync::Mutex<Option<tauri::menu::Menu<R>>>);

// #[cfg(all(desktop, not(test)))]
// pub struct PopupMenu<R: Runtime>(tauri::menu::Menu<R>);

#[tauri::command]
fn stack_start(path: &str) -> String {
    let path_owned = path.to_string();
    tauri::async_runtime::spawn(async move {
        cli::run(&path_owned).await;
    });
    // format!("{:?}", result)
    format!("Running {} asynchronously", path)
}

// #[tauri::command]
// fn mouse_over() -> Result<(), String> {
//     if let Some(window) = MAIN_WINDOW.lock().unwrap().as_ref() {
//         window
//             .set_size(tauri::Size::Logical(tauri::LogicalSize {
//                 width: 512.0,
//                 height: 256.0,
//             }))
//             .map_err(|e| e.to_string())
//     } else {
//         Ok(())
//     }
// }

// #[tauri::command]
// fn mouse_leave() -> Result<(), String> {
//     if let Some(window) = MAIN_WINDOW.lock().unwrap().as_ref() {
//         window
//             .set_size(tauri::Size::Logical(tauri::LogicalSize {
//                 width: 512.0,
//                 height: 24.0,
//             }))
//             .map_err(|e| e.to_string())
//     } else {
//         Ok(())
//     }
// }

fn init_stacks(app: &AppHandle) {
    load_stacks(app, stack_start)
        .map_err(|e| log::error!("Failed to run initialization stacks: {:#?}", e))
        .ok();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    // let tray_menu = SystemTrayMenu::new()
    //     .add_item(quit)
    //     .add_native_item(SystemTrayMenuItem::Separator)
    //     .add_item(CustomMenuItem::new("hello".to_string(), "Hello"));

    // let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        // .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_cli::init())
        .setup(|app| {
            let handle = app.handle();
            // *APP.lock().unwrap() = Some(handle.clone());

            tray::create_tray(handle)?;

            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build());

            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = handle.plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--autostart"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
                // Check enable state
                println!(
                    "registered for autostart? {}",
                    autostart_manager.is_enabled().unwrap()
                );
                // Disable autostart
                let _ = autostart_manager.disable();
            }

            // handle.plugin(menu_plugin::init())?;

            // #[cfg(all(desktop, not(test)))]
            // app.manage(PopupMenu(
            //     tauri::menu::MenuBuilder::new(app)
            //         .check("check", "Tauri is awesome!")
            //         .text("text", "Do something")
            //         .copy()
            //         .build()?,
            // ));

            // #[cfg(target_os = "macos")]
            // app.manage(AppMenu(Default::default()));

            // let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
            //     .inner_size(512.0, 24.0)
            //     .resizable(false)
            //     .maximizable(false)
            //     .minimizable(false)
            //     .closable(false)
            //     // .transparent(true)
            //     .decorations(false)
            //     .always_on_top(true);

            // // set transparent title bar only when building for macOS
            // #[cfg(target_os = "macos")]
            // let win_builder = win_builder.hidden_title(true);

            // let window = win_builder.build()?;
            // *MAIN_WINDOW.lock().unwrap() = Some(window.clone());

            // // set background color only when building for macOS
            // #[cfg(target_os = "macos")]
            // {
            //     use cocoa::appkit::{NSColor, NSWindow};
            //     use cocoa::base::{id, nil};

            //     let ns_window = window.ns_window().unwrap() as id;
            //     unsafe {
            //         let bg_color = NSColor::colorWithRed_green_blue_alpha_(
            //             nil,
            //             50.0 / 255.0,
            //             158.0 / 255.0,
            //             163.5 / 255.0,
            //             0.5,
            //         );
            //         ns_window.setBackgroundColor_(bg_color);
            //     }
            // }

            // let webview = app.get_webview_window("main").unwrap();
            // webview.eval("console.log('hello from Rust')")?;

            #[cfg(desktop)]
            {
                // let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                // let menu = Menu::with_items(app, &[&quit_i])?;

                // let tray = TrayIconBuilder::new()
                //     .menu(&menu)
                //     .on_menu_event(|app, event| match event.id.as_ref() {
                //         "quit" => {
                //             println!("quit menu item was clicked");
                //             app.exit(0);
                //         }
                //         _ => {
                //             println!("menu item {:?} not handled", event.id);
                //         }
                //     })
                //     .menu_on_left_click(true)
                //     .build(app)?;

                // TODO: Position window in the center below the tray
                // window.move_window(Position::TopCenter).unwrap();

                // app.handle().plugin(tauri_plugin_positioner::init())?;
                // tauri::tray::TrayIconBuilder::new()
                //     .on_tray_icon_event(|tray_handle, event| {
                //         tauri_plugin_positioner::on_tray_event(tray_handle.app_handle(), &event);
                //     })
                //     .build(app)?;
            }

            // Get arguments passed when opening files with the app
            let args: Vec<String> = std::env::args().collect();
            log::debug!("Reading arguments: {:?}", args);
            if args.len() > 1 {
                // First argument after binary name might be the file path
                let path = args[1].clone();
                log::debug!("ONE argument: {:?}", path);
                if path.ends_with(".stack") {
                    log::info!("Stack file opened on launch: {}", path);

                    let path_clone = path.clone();
                    tauri::async_runtime::spawn(async move {
                        cli::run(&path_clone).await;
                    });

                    app.emit("tauri://stack-file-opened", &path).unwrap();
                }
            }

            // Hide from the dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            match app.cli().matches() {
                // `matches` here is a Struct with { args, subcommand }.
                // `args` is `HashMap<String, ArgData>` where `ArgData` is a struct with { value, occurrences }.
                // `subcommand` is `Option<Box<SubcommandMatches>>` where `SubcommandMatches` is a struct with { name, matches }.
                Ok(matches) => match matches.subcommand {
                    Some(matches) => {
                        let name = matches.name.clone();
                        let source_path = matches
                            .matches
                            .args
                            .get("source")
                            .map(|arg| arg.value.clone())
                            .take()
                            .unwrap_or_default()
                            .to_string();

                        log::info!("CLI command: {:?} {:?}", name, source_path);

                        if matches.name == "pack" {
                            log::debug!("Packing app: {:?}", source_path);

                            cli::pack(&source_path);

                            app.handle().exit(0);
                        }
                    }
                    None => {
                        log::debug!("No subcommand provided")
                    }
                },
                Err(_) => {}
            }

            // Only start the server if we are in a desktop environment
            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();

                thread::spawn(|| {
                    api::init(app_handle).unwrap();
                });
            }

            Ok(())
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "[{}] [{}] {}",
                        record.target(),
                        record.level(),
                        message
                    ))
                })
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                    // tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            stack_start,
            // mouse_over,
            // mouse_leave,
            docker::list_stacks,
            docker::list_containers,
            // docker::list_networks,
            docker::docker_events
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::MainEventsCleared = event {
                // Skip logging MainEventsCleared events
            } else {
                log::debug!("App event: {:?}", event);
            }

            // As soon as the app is ready, load the initialization stacks
            if let tauri::RunEvent::Ready = event {
                init_stacks(app);
            }

            #[cfg(any(target_os = "macos", target_os = "ios"))]
            // handle .stack file opening events
            if let tauri::RunEvent::Opened { urls } = event {
                let files = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .collect::<Vec<_>>();
                let path = files[0].to_str().unwrap().to_string();
                log::info!("Opening stack file: {:#?}", path);
                tauri::async_runtime::spawn(async move {
                    cli::run(&path).await;
                });
                // log::info!("{:?}", result);
            }
        });
}
