from __future__ import annotations

import logging
import os
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()


from .generation import generate_section_payload, get_llm
from .indexing import build_index as build_faiss_index
from .indexing import describe_index, ensure_index
from .models import (
    BuildIndexRequest,
    IndexStatus,
    IntakeRequest,
    Proposal,
    ProposalRequest,
    ProposalResponse,
    SectionRequest,
    SectionResponse,
    SessionState,
)
from .session import SessionStore

logger = logging.getLogger(__name__)

app = FastAPI(title="Municipal Proposal Copilot")

default_origins = ["http://localhost:1420", "http://localhost:5173"]
configured_origins = os.getenv("ALLOWED_ORIGINS")
if configured_origins:
    origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    if not origins:
        origins = default_origins
else:
    origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = SessionStore()


@app.on_event("startup")
def prepare_index() -> None:
    try:
        ensure_index()
    except FileNotFoundError as exc:
        logger.warning("Automatic FAISS index build skipped: %s", exc)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Unexpected error while preparing FAISS index: %s", exc)


@app.get("/index/status", response_model=IndexStatus)
def index_status() -> IndexStatus:
    return describe_index()


@app.post("/index/rebuild", response_model=IndexStatus, status_code=status.HTTP_202_ACCEPTED)
def rebuild_index(payload: BuildIndexRequest) -> IndexStatus:
    try:
        return build_faiss_index(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Failed to rebuild FAISS index: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to rebuild FAISS index") from exc


@app.post("/intake_profile")
def intake_profile(payload: IntakeRequest) -> SessionState:
    state = sessions.set_profile(payload.session_id, payload.profile)
    return state


@app.post("/sections/complete")
def complete_section(payload: SectionRequest) -> SectionResponse:
    state = sessions.load(payload.session_id)
    if not state.profile:
        raise HTTPException(status_code=400, detail="Profile not found for session")
    try:
        llm = get_llm()
        volume, citations, validation = generate_section_payload(payload, state.profile, llm)
    except (EnvironmentError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return SectionResponse(volume=volume, citations=citations, validation=validation)


@app.post("/proposal/complete")
def complete_proposal(payload: ProposalRequest) -> ProposalResponse:
    state = sessions.load(payload.session_id)
    if not state.profile:
        raise HTTPException(status_code=400, detail="Profile not found for session")

    try:
        llm = get_llm()
    except EnvironmentError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    sections: List[SectionResponse] = []
    for section_spec in payload.volume_list:
        section_request = SectionRequest(
            session_id=payload.session_id,
            query=payload.query,
            section_spec=section_spec,
            grant=payload.grant,
        )
        try:
            volume, citations, validation = generate_section_payload(section_request, state.profile, llm)
        except (FileNotFoundError, ValueError) as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        sections.append(SectionResponse(volume=volume, citations=citations, validation=validation))

    proposal = Proposal(title=payload.grant.title, volumes=[s.volume for s in sections])
    sessions.set_proposal(payload.session_id, proposal)

    return ProposalResponse(title=proposal.title, volumes=sections)


@app.get("/session/{session_id}")
def get_session(session_id: str) -> SessionState:
    return sessions.load(session_id)

