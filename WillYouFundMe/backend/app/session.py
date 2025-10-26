from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from .models import Proposal, Profile, SessionState


class SessionStore:
    def __init__(self, root_dir: Optional[Path] = None) -> None:
        self.root_dir = root_dir or Path(__file__).resolve().parent / "sessions"
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def _session_path(self, session_id: str) -> Path:
        return self.root_dir / f"{session_id}.json"

    def load(self, session_id: str) -> SessionState:
        path = self._session_path(session_id)
        if not path.exists():
            return SessionState()
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return SessionState(**data)

    def save(self, session_id: str, state: SessionState) -> None:
        path = self._session_path(session_id)
        with path.open("w", encoding="utf-8") as f:
            json.dump(state.dict(), f, indent=2)

    def set_profile(self, session_id: str, profile: Profile) -> SessionState:
        state = self.load(session_id)
        state.profile = profile
        state.messages = []
        state.summary = None
        state.last_proposal = None
        self.save(session_id, state)
        return state

    def set_proposal(self, session_id: str, proposal: Proposal) -> SessionState:
        state = self.load(session_id)
        state.last_proposal = proposal
        self.save(session_id, state)
        return state

