from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class SectionType(str, Enum):
    narrative = "narrative"
    bullets = "bullets"
    table = "table"


class Profile(BaseModel):
    name: str
    population: Optional[int] = None
    region: Optional[str] = None
    priorities: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    assets: List[str] = Field(default_factory=list)
    baseline_metrics: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class Grant(BaseModel):
    title: str
    sponsor: str
    criteria: List[str] = Field(default_factory=list)
    due_date: Optional[str] = None
    max_amount: Optional[float] = None


class SectionSpec(BaseModel):
    id: str
    title: str
    type: SectionType
    word_max: Optional[int] = None
    required_terms: Optional[List[str]] = None


class BudgetRow(BaseModel):
    item: str
    cost: float


class Volume(BaseModel):
    id: str
    title: str
    type: SectionType
    body: Optional[str] = None
    items: Optional[List[str]] = None
    rows: Optional[List[BudgetRow]] = None

    @validator("items", always=True)
    def normalize_items(cls, value: Optional[List[str]], values: Dict[str, Any]) -> Optional[List[str]]:
        if values.get("type") == SectionType.bullets and value is None:
            return []
        return value


class Proposal(BaseModel):
    title: str
    volumes: List[Volume]


class SessionState(BaseModel):
    profile: Optional[Profile] = None
    summary: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    last_proposal: Optional[Proposal] = None


class IntakeRequest(BaseModel):
    session_id: str
    profile: Profile


class SectionRequest(BaseModel):
    session_id: str
    query: str
    section_spec: SectionSpec
    grant: Grant


class ProposalRequest(BaseModel):
    session_id: str
    query: str
    volume_list: List[SectionSpec]
    grant: Grant


class ValidationIssue(BaseModel):
    passed: bool
    issues: List[str] = Field(default_factory=list)


class SectionResponse(BaseModel):
    volume: Volume
    citations: List[Dict[str, Any]]
    validation: ValidationIssue


class ProposalResponse(BaseModel):
    title: str
    volumes: List[SectionResponse]


class BuildIndexRequest(BaseModel):
    corpus_path: Path = Field(default=Path("corpus"))
    index_path: Path = Field(default=Path("faiss_index"))
    chunk_size: int = 600
    chunk_overlap: int = 120

