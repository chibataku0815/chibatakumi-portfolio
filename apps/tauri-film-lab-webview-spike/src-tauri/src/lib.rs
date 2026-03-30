// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// プローブ結果を stderr に出す（端末から起動したときの自動検証用）。
#[tauri::command]
fn emit_probe_report(report: String) {
    use std::io::Write;
    let _ = writeln!(
        std::io::stderr(),
        "--- TAURI_WKWEBVIEW_PROBE ---\n{report}"
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, emit_probe_report])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
