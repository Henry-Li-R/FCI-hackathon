from fastapi import FastAPI
from pydantic import BaseModel
import requests, os

app = FastAPI()

MODEL_API_URL = "https://your-model-api.com/generate"
API_KEY = os.environ.get("MODEL_API_KEY")

class ProposalRequest(BaseModel):
    input: str
    context: str



@app.post("/generate")
def generate(req: ProposalRequest):
    payload = {"input": req.input, "context": req.context}
    headers = {"Authorization": f"Bearer {API_KEY}"}
    response = requests.post(MODEL_API_URL, json=payload, headers=headers)
    return {"text": response.text}

@app.get("/")
def read_root():
    return {"Hello": "World"}