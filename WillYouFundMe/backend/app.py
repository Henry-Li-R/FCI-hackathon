# backend/app.py
from fastapi import FastAPI
import requests
import os

app = FastAPI()

MODEL_API_URL = "https://your-model-api.com/generate"
API_KEY = os.environ.get("MODEL_API_KEY")

@app.post("/generate")
def generate(input: str, context: str):
    payload = {"input": input, "context": context}
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.post(MODEL_API_URL, json=payload, headers=headers)
    return {"text": response.text}

