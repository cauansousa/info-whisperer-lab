#[tauri::command]
fn check_ollama() -> bool {
    use std::net::TcpStream;
    use std::time::Duration;

    // Primary check: is Ollama's HTTP port open?
    if TcpStream::connect_timeout(
        &"127.0.0.1:11434".parse().unwrap(),
        Duration::from_millis(500),
    )
    .is_ok()
    {
        return true;
    }

    // Fallback: try common install paths for the CLI
    let paths = [
        "/usr/local/bin/ollama",
        "/opt/homebrew/bin/ollama",
        "/usr/bin/ollama",
    ];
    paths.iter().any(|p| {
        std::process::Command::new(p)
            .arg("list")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![check_ollama])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
