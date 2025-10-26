use reqwest::blocking::Client;
use tauri::command;

#[command]
fn generate_section(input: String, context: String) -> Result<String, String> {
    let client = Client::new();
    let resp = client.post("http://127.0.0.1:8000/generate")
        .json(&serde_json::json!({ "input": input, "context": context }))
        .send();

    match resp {
        Ok(r) => Ok(r.text().unwrap_or_default()),
        Err(e) => Err(format!("API request failed: {}", e)),
    }
}

