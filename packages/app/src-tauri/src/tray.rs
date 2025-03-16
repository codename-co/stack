// #![cfg(all(desktop, not(test)))]

use log::{debug, error, info};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    include_image,
    menu::{
        AboutMetadata, CheckMenuItem, IconMenuItem, Menu, MenuBuilder, MenuItem, SubmenuBuilder,
    },
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime, WebviewUrl,
};
use tauri_plugin_shell::ShellExt;
use tokio::time::interval;
use tokio::time::Duration;

use crate::{cert, docker, updater};

fn create_menu(handle: &tauri::AppHandle<tauri::Wry>) -> tauri::Result<Menu<tauri::Wry>> {
    let mut menu_builder = MenuBuilder::new(handle)
        .item(&MenuItem::with_id(
            handle,
            "new",
            "New stack",
            true,
            Some("cmd+n"),
        )?)
        .separator();

    let stacks: Result<Vec<String>, String> =
        tauri::async_runtime::block_on(docker::list_stacks(false));

    if let Ok(stack_list) = stacks {
        for stack in stack_list {
            let name = &stack;
            menu_builder = menu_builder.item(&MenuItem::with_id(
                handle,
                format!("stack-{}", name),
                format!("⛁ {}", name),
                true,
                None::<&str>,
            )?);
        }
    }

    menu_builder = menu_builder.separator()
        .item(
            // submenu
            &SubmenuBuilder::new(handle, "More")
                .about(Some(AboutMetadata {
                    name: Some("Stack".to_string()),
                    version: Some("Version preview".to_string()),
                    icon: Some(include_image!("icons/icon.png")),
                    // license: Some("MIT".to_string()),
                    website: Some("https://stack.lol".to_string()),
                    ..Default::default()
                }))
                .item(&MenuItem::with_id(
                    handle,
                    "trust_certificate",
                    "Trust Certificate 🔒",
                    true,
                    None::<&str>,
                )?)
                .item(&MenuItem::with_id(
                    handle,
                    "check_update",
                    "Check for Updates…",
                    false, // TODO:
                    None::<&str>,
                )?)
                .build()?,
        )
        .quit_with_text("Quit")
        // .item(&MenuItem::with_id(
        //     handle,
        //     "quit",
        //     "Quit",
        //     true,
        //     Some("cmd+q"),
        // )?)
        ;

    return Ok(menu_builder.build()?);
}

pub fn create_tray(app: &tauri::AppHandle<tauri::Wry>) -> tauri::Result<()> {
    let handle = app.app_handle();

    // let new_window_i = MenuItem::with_id(app, "new-window", "New window", true, None::<&str>)?;
    // let icon_light = MenuItem::with_id(app, "icon-light", "Icon light", true, None::<&str>)?;
    // let icon_dark = MenuItem::with_id(app, "icon-dark", "Icon dark", true, None::<&str>)?;
    // #[cfg(target_os = "macos")]
    // let switch_i = MenuItem::with_id(app, "switch-menu", "Switch Menu", true, None::<&str>)?;
    // let quit_i = MenuItem::with_id(app, "quit", "Quit", true, Some("cmd+q"))?;

    // let submenu = SubmenuBuilder::new(handle, "File")
    //     .item(&MenuItem::new(handle, "MenuItem 1", true, None::<&str>)?)
    //     .items(&[
    //         &CheckMenuItem::new(handle, "CheckMenuItem 1", true, true, None::<&str>)?,
    //         // &IconMenuItem::new(handle, "IconMenuItem 1", true, Some(icon1), None::<&str>)?,
    //     ])
    //     .separator()
    //     .cut()
    //     .copy()
    //     .paste()
    //     .separator()
    //     .text("item2", "MenuItem 2")
    //     .check("checkitem2", "CheckMenuItem 2")
    //     .icon(
    //         "iconitem2",
    //         "IconMenuItem 2",
    //         app.default_window_icon().cloned().unwrap(),
    //     )
    //     .build()?;

    // let menu1 = Menu::with_items(
    //     app,
    //     &[
    //         &new_window_i,
    //         &icon_light,
    //         &icon_dark,
    //         #[cfg(target_os = "macos")]
    //         &switch_i,
    //         &MenuItem::with_id(app, "separator", "", false, None::<&str>)?,
    //         &quit_i,
    //     ],
    // )?;
    // menu1.append(&submenu)?;
    // let menu2 = Menu::with_items(app, &[&new_window_i, &switch_i, &quit_i])?;

    // let is_menu1 = AtomicBool::new(true);

    let _ = TrayIconBuilder::with_id("tray-1")
        .tooltip("Stack")
        .icon(include_image!("icons/32x32-white.png"))
        .menu(&create_menu(handle).unwrap())
        // .show_menu_on_left_click(false)
        .on_menu_event(
            move |app: &tauri::AppHandle, event| match event.id.as_ref() {
                // "test_download" => {
                //     let url = "https://stack.lol/downloads/excalidraw.stack";
                //     debug!("Downloading... {:?}", url);
                //     tauri::async_runtime::spawn(async move {
                //         cli::run(url).await;
                //     });
                // }
                "new" => {
                    let shell = app.app_handle().shell();
                    let output = tauri::async_runtime::block_on(async move {
                        shell
                            .command("open")
                            .args(["https://stack.lol"])
                            .output()
                            .await
                            .unwrap()
                    });

                    if output.status.success() {
                        info!("Result: {:?}", String::from_utf8(output.stdout));
                    } else {
                        error!("Exit with code: {}", output.status.code().unwrap());
                    }
                }
                "trust_certificate" => {
                    let app_handle = app.app_handle().clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(err) = cert::trust_certificate(&app_handle) {
                            error!("Failed to trust certificate: {:?}", err);
                        }
                    });
                }
                "check_update" => {
                    let app_handle = app.app_handle().clone();
                    tauri::async_runtime::spawn(async move {
                        updater::update(app_handle).await.unwrap();
                    });
                }
                _ => {
                    debug!("Menu event: {:?}", event.id);

                    let id_string = event.id.as_ref().to_string();
                    let stack_name = id_string.strip_prefix("stack-").unwrap();
                    let stack_url = format!("https://{}.stack.localhost", stack_name);

                    let shell = app.app_handle().shell();
                    let output = tauri::async_runtime::block_on(async move {
                        shell
                            .command("open")
                            .args([stack_url])
                            .output()
                            .await
                            .unwrap()
                    });

                    if output.status.success() {
                        info!("Result: {:?}", String::from_utf8(output.stdout));
                    } else {
                        error!("Exit with code: {}", output.status.code().unwrap());
                    }
                }
                // "quit" => {
                //     info!("Quit!");
                //     app.exit(0);
                // }
                // "new-window" => {
                //     let _webview = tauri::WebviewWindowBuilder::new(
                //         app,
                //         "new",
                //         WebviewUrl::App("index.html".into()),
                //     )
                //     .title("Tauri")
                //     .build()
                //     .unwrap();
                // }
                // i @ "icon-light" | i @ "icon-dark" => {
                //     if let Some(tray) = app.tray_by_id("tray-1") {
                //         let icon = if i == "icon-light" {
                //             include_image!("icons/32x32-black.png")
                //         } else {
                //             include_image!("icons/32x32-white.png")
                //         };
                //         let _ = tray.set_icon(Some(icon));
                //     }
                // }
                // "switch-menu" => {
                //     let flag = is_menu1.load(Ordering::Relaxed);
                //     let (menu, tooltip) = if flag {
                //         (menu2.clone(), "Menu 2")
                //     } else {
                //         (menu.clone(), "Tauri")
                //     };
                //     if let Some(tray) = app.tray_by_id("tray-1") {
                //         let _ = tray.set_menu(Some(menu));
                //         let _ = tray.set_tooltip(Some(tooltip));
                //     }
                //     is_menu1.store(!flag, Ordering::Relaxed);
                // }
                _ => {}
            },
        )
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app);

    // Create a background task to refresh the menu
    let app_handle = handle.clone();
    tauri::async_runtime::spawn(async move {
        let mut interval = interval(Duration::from_secs(2));
        loop {
            interval.tick().await;
            debug!("Refreshing menu");
            if let Some(tray) = app_handle.tray_by_id("tray-1") {
                if let Ok(new_menu) = create_menu(&app_handle) {
                    let _ = tray.set_menu(Some(new_menu));
                }
            }
        }
    });

    Ok(())
}
