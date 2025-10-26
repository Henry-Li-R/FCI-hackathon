import requests

intake_payload = {
    "session_id": "abc123",
    "profile": {
        "name": "Community A",
        "population": 1200,
        "region": "Qikiqtaaluk",
        "priorities": ["housing", "food security", "employment"],
        "constraints": ["limited bandwidth", "remote location", "small budget"],
        "assets": ["local hunters association", "community hall", "transportation fleet"],
        "baseline_metrics": {
            "average_income": 55000,
            "housing_units": 300,
            "unemployment_rate": 0.12
        },
        "notes": "Focus on sustainable housing and local food programs."
    }
}
payload = {
    "session_id": "abc123",
    "query": "Describe the current housing challenges and priorities in Community A.",
    "section_spec": {
        "id": "housing_section",
        "title": "Housing Challenges and Priorities",
        "type": "narrative",
        "word_max": 300,
        "required_terms": ["housing", "community", "priority"]
    },
    "grant": {
        "title": "Community Development Grant",
        "sponsor": "Government of Nunavut",
        "criteria": ["supports housing initiatives", "community-led solutions"],
        "due_date": "2025-12-31",
        "max_amount": 50000.0
    }
}
_ = requests.post("http://127.0.0.1:8000/intake_profile", json=intake_payload)
resp = requests.post("http://127.0.0.1:8000/sections/complete", json=payload)
print(resp.json())

