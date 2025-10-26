use tauri::command;
use reqwest::blocking::Client;

#[command]
pub fn test_python_api() -> Result<String, String> {
    let client = Client::new();
    let resp = client
        .post("http://127.0.0.1:8000/generate")
        .json(&serde_json::json!({
            "input": "Test section",
            "context": "Test community context"
        }))
        .send();

    match resp {
        Ok(r) => Ok(r.text().unwrap_or_else(|_| "Empty response".into())),
        Err(e) => Err(format!("Failed to reach Python API: {}", e)),
    }
}
