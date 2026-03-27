use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

// ─── Ollama types ────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct OllamaMessage {
    pub role: String,
    pub content: String,
}

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OllamaEvent {
    Token { content: String },
    Done,
    Error { message: String },
}

// ─── check_ollama ─────────────────────────────────────────────────────────────

#[tauri::command]
fn check_ollama() -> bool {
    use std::net::TcpStream;
    use std::time::Duration;

    // Try both IPv4 and IPv6 loopback since macOS may use either
    let addrs = ["127.0.0.1:11434", "[::1]:11434"];
    for addr in &addrs {
        if let Ok(parsed) = addr.parse() {
            if TcpStream::connect_timeout(&parsed, Duration::from_millis(1500)).is_ok() {
                return true;
            }
        }
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

// ─── list_ollama_models ───────────────────────────────────────────────────────

#[tauri::command]
async fn list_ollama_models() -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("http://localhost:11434/api/tags")
        .send()
        .await
        .map_err(|e| format!("Ollama não acessível: {}", e))?;

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Falha ao ler resposta: {}", e))?;

    let models = data["models"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
        .collect();

    Ok(models)
}

// ─── query_ollama ─────────────────────────────────────────────────────────────

#[tauri::command]
async fn query_ollama(
    model: String,
    messages: Vec<OllamaMessage>,
    on_event: Channel<OllamaEvent>,
) -> Result<(), String> {
    use futures_util::StreamExt;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
    });

    let response = client
        .post("http://localhost:11434/api/chat")
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            let _ = on_event.send(OllamaEvent::Error {
                message: format!("Falha ao conectar ao Ollama: {}", e),
            });
            e.to_string()
        })?;

    if !response.status().is_success() {
        let msg = format!("Ollama retornou erro: {}", response.status());
        let _ = on_event.send(OllamaEvent::Error { message: msg.clone() });
        return Err(msg);
    }

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e: reqwest::Error| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                // Stream token
                if let Some(content) = json["message"]["content"].as_str() {
                    if !content.is_empty() {
                        let _ = on_event.send(OllamaEvent::Token {
                            content: content.to_string(),
                        });
                    }
                }

                // Stream finished
                if json["done"].as_bool().unwrap_or(false) {
                    let _ = on_event.send(OllamaEvent::Done);
                    return Ok(());
                }
            }
        }
    }

    let _ = on_event.send(OllamaEvent::Done);
    Ok(())
}

// ─── App entry point ──────────────────────────────────────────────────────────

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
        .invoke_handler(tauri::generate_handler![
            check_ollama,
            list_ollama_models,
            query_ollama,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
