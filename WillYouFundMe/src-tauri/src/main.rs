// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands; // imports commands.rs

use tauri::Builder;
use commands::test_python_api; // bring the function into scope


fn main() {
    willyoufundme_lib::run();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![test_python_api])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
