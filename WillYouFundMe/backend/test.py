import requests

payload = {"input": "Test section", "context": "Test community context"}
resp = requests.post("http://127.0.0.1:8000/generate", json=payload)
print(resp.json())

