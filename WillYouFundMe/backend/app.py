from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# Set your API key and model URL (could also use environment variables)
API_KEY = os.getenv("MODEL_API_KEY", "your_api_key_here")
MODEL_API_URL = "https://api.deepseek.com"

# Request model
class ProposalRequest(BaseModel):
    input: str
    context: str

@app.post("/generate")
def generate(req: ProposalRequest):
    """
    Calls the external LangChain / Ollama API to generate text for a proposal section.
    """
    payload = {
        "input": req.input,
        "context": req.context
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(MODEL_API_URL, json=payload, headers=headers, timeout=15)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx, 5xx)
        
        # Assume the API returns JSON like {"text": "...generated text..."}
        data = response.json()
        generated_text = data.get("text", "")

        return {"text": generated_text}

    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=f"HTTP error: {e}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {e}")
    except ValueError:
        # JSON decode error
        raise HTTPException(status_code=500, detail="Failed to parse API response as JSON")
