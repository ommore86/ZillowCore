// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

#[tauri::command]
fn get_desktop_version() -> String {
    "1.0.0-windows-x64".to_string()
}

#[tauri::command]
fn ping_backend_status() -> bool {
    // Desktop native ping hook
    true
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit EstateOS AI");
    let close = CustomMenuItem::new("close".to_string(), "Close Window");
    let file_submenu = Submenu::new("File", Menu::new().add_item(close).add_item(quit));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
        .add_submenu(file_submenu);

    tauri::Builder::default()
        .menu(menu)
        .invoke_handler(tauri::generate_handler![get_desktop_version, ping_backend_status])
        .run(tauri::generate_context!())
        .expect("error while running EstateOS AI desktop application");
}

