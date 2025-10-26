# Municipal Proposal Copilot Backend

This FastAPI service drafts structured municipal grant proposal sections using LangChain, DeepSeek, and a FAISS-backed retrieval system. It maintains lightweight session state and exposes endpoints for collecting intake profiles, generating individual sections, and assembling complete proposals.

## Requirements

- Python 3.11+
- FAISS CPU libraries (installed via `faiss-cpu` PyPI package)
- Environment variables:
  - `DEEPSEEK_API_KEY`: API key for DeepSeek's OpenAI-compatible endpoint
  - `DEEPSEEK_API_BASE` (optional): Override base URL (defaults to `https://api.deepseek.com/v1`)
  - `FAISS_INDEX_PATH` (optional): Filesystem path where the index is stored (defaults to `backend/app/faiss_index`)

## Setup

```bash
cd WillYouFundMe/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Build the Retrieval Index

Populate the `corpus/` directory with `.txt` files, then run:

```bash
python scripts/build_index.py --corpus corpus --index app/faiss_index
```

The script chunks the corpus with LangChain's `RecursiveCharacterTextSplitter`, embeds passages with `sentence-transformers/all-MiniLM-L6-v2`, and writes a FAISS index to `app/faiss_index/`.

## Running the API

```bash
uvicorn app.main:app --reload --port 8000
```

CORS is enabled for `http://localhost:5173` by default.

## Endpoints

### `POST /intake_profile`
Stores or replaces the profile for a session and clears previous outputs.

**Request**
```json
{
  "session_id": "demo-session",
  "profile": {
    "name": "Riverbend",
    "population": 120000,
    "region": "Midwest",
    "priorities": ["stormwater resilience", "green jobs"],
    "constraints": ["aging pump stations"],
    "assets": ["university partnership"],
    "baseline_metrics": {"gallons_treated_daily": 3200000},
    "notes": "Focus on flood mitigation"
  }
}
```

### `POST /sections/complete`
Generates a single section with retrieval-augmented context, structured output, and validation results.

**Request**
```json
{
  "session_id": "demo-session",
  "query": "Focus on resilience upgrades and workforce development",
  "section_spec": {
    "id": "exec_summary",
    "title": "Executive Summary",
    "type": "narrative",
    "word_max": 180
  },
  "grant": {
    "title": "Climate Resilience Infrastructure Grant",
    "sponsor": "State Resilience Office",
    "criteria": [
      "flood mitigation",
      "community workforce",
      "data-driven impact"
    ]
  }
}
```

**Response**
```json
{
  "volume": {
    "id": "exec_summary",
    "title": "Executive Summary",
    "type": "narrative",
    "body": "..."
  },
  "citations": [
    {"source": "sample_guidance.txt", "snippet": "..."}
  ],
  "validation": {
    "passed": true,
    "issues": []
  }
}
```

### `POST /proposal/complete`
Generates multiple sections in sequence, saving the result as the session's `last_proposal`.

**Request**
```json
{
  "session_id": "demo-session",
  "query": "Update to emphasize sensor upgrades and measurable KPIs",
  "volume_list": [
    {"id": "exec_summary", "title": "Executive Summary", "type": "narrative", "word_max": 180},
    {"id": "problem", "title": "Problem Statement", "type": "narrative", "word_max": 250},
    {"id": "objectives", "title": "Objectives", "type": "bullets"},
    {"id": "budget", "title": "Budget", "type": "table"}
  ],
  "grant": {
    "title": "Climate Resilience Infrastructure Grant",
    "sponsor": "State Resilience Office",
    "criteria": [
      "flood mitigation",
      "community workforce",
      "data-driven impact"
    ]
  }
}
```

### `GET /session/{id}`
Returns the persisted session state, including the stored profile and any last generated proposal.

## Sample End-to-End Flow

1. POST an intake profile.
2. Build the FAISS index (`python scripts/build_index.py --corpus corpus --index app/faiss_index`).
3. Generate individual sections with `/sections/complete` or a full proposal via `/proposal/complete`.
4. Use `/session/{id}` to inspect the stored profile and latest proposal payload for debugging.

The service validates narrative lengths, required grant term usage, bullet counts, and budget contingency requirements. Failed validations trigger one automatic revision attempt before returning issues to the client.

