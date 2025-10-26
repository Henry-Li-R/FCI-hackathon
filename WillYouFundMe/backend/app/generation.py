from __future__ import annotations

import json
import os
import logging
import re
from typing import List, Optional, Tuple, Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

from .models import Grant, Profile, SectionRequest, SectionSpec, ValidationIssue, Volume, SectionType
from .rag import format_citations, retrieve_chunks
from .validation import validate_volume


logger = logging.getLogger(__name__)


def get_llm() -> ChatOpenAI:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise EnvironmentError("DEEPSEEK_API_KEY environment variable is required")
    base_url = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")
    return ChatOpenAI(
        openai_api_key=api_key,
        openai_api_base=base_url,
        model="deepseek-chat",
        temperature=0.3,
    )


SECTION_JSON_SCHEMA = (
    '{"volume": {"id": "", "title": "", "type": "narrative|bullets|table", '
    '"body": null, "items": null, "rows": [{"item": "", "cost": 0.0}]}, "rationale": ""}'
)


def build_prompt(section_spec: SectionSpec, grant: Grant) -> ChatPromptTemplate:
    system_prompt = (
        "You are Municipal Proposal Copilot. Draft clear, evidence-based municipal grant proposal"
        " sections using the retrieved context. Always comply with the requested format and word limits"
        " and respond with JSON."
    )
    human_prompt = (
        "Grant: {grant_title} by {grant_sponsor}. Criteria: {criteria}.\n"
        "Section Spec: id={section_id}, title={section_title}, type={section_type}, word_max={word_max}."
        " Required terms: {required_terms}.\n"
        "Municipality Profile: {profile}.\n"
        "User Query: {query}.\n"
        "Retrieved Evidence:\n{context}\n"
        "Return JSON with keys volume and rationale. Volume must include id, title, type and"
        " the fields required for that type (body for narratives, items for bullets, rows for tables)."
        " For table sections, rows must be a list of objects with 'item' and numeric 'cost' fields suitable"
        " for calculations (no currency symbols)."
        " Keep narratives within the word cap and cite evidence inline using bracketed numbers"
        " referencing the provided context indices."
    )
    return ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", human_prompt),
        ]
    )


def render_context(documents: List[Document]) -> str:
    parts = []
    for idx, doc in enumerate(documents, 1):
        source = doc.metadata.get("source", f"doc-{idx}")
        parts.append(f"[{idx}] {source}: {doc.page_content}")
    return "\n".join(parts)


def _extract_json_blob(raw_text: str) -> str:
    """Return a best-effort JSON string from an LLM response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```", 2)
        if len(parts) >= 3:
            # The middle segment is the fenced content, possibly prefixed with a language tag
            candidate = parts[1]
            if "\n" in candidate:
                _, content = candidate.split("\n", 1)
            else:
                content = candidate
            return content.strip()
    return cleaned


_HEADER_TOKENS = {"item", "description", "cost", "amount", "justification", "notes"}


def _coerce_cost(value: Any) -> Optional[float]:
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    cleaned = re.sub(r"\[[^\]]*\]", "", cleaned)
    cleaned = cleaned.replace(",", "")
    cleaned = re.sub(r"[^0-9.\-]", "", cleaned)
    if not cleaned or cleaned in {"-", ".", "-.", ".-"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize_volume_payload(volume_payload: dict[str, Any]) -> dict[str, Any]:
    if volume_payload.get("type") != SectionType.table:
        return volume_payload

    rows = volume_payload.get("rows")
    if not isinstance(rows, list):
        return volume_payload

    normalized = []
    for entry in rows:
        item: Optional[str] = None
        cost_value: Optional[float] = None

        if isinstance(entry, dict):
            item = entry.get("item") or entry.get("Item")
            raw_cost = entry.get("cost") or entry.get("Cost")
            cost_value = _coerce_cost(raw_cost)
        elif isinstance(entry, (list, tuple)):
            if not entry:
                continue
            tokenized = [str(cell).strip().lower() for cell in entry if isinstance(cell, str)]
            if tokenized and all(token in _HEADER_TOKENS for token in tokenized):
                continue
            item = str(entry[0]).strip()
            for cell in reversed(entry[1:]):
                cost_value = _coerce_cost(cell)
                if cost_value is not None:
                    break
        else:
            continue

        if not item:
            continue

        if item.strip().lower().startswith("total") and normalized:
            # Skip total rows to avoid double-counting sums.
            continue

        if cost_value is None:
            continue

        normalized.append({"item": item, "cost": cost_value})

    if normalized:
        volume_payload = {**volume_payload, "rows": normalized}

    return volume_payload


def parse_volume(raw_text: str) -> Volume:
    payload = _extract_json_blob(raw_text)
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM response as JSON: %s", raw_text)
        raise ValueError("LLM response was not valid JSON") from exc
    volume_payload = _normalize_volume_payload(data.get("volume", {}))
    return Volume(**volume_payload)


def generate_section_payload(
    request: SectionRequest,
    profile: Optional[Profile],
    llm: Optional[ChatOpenAI] = None,
) -> Tuple[Volume, List[dict], ValidationIssue]:
    documents = retrieve_chunks(request.query)
    citations = format_citations(documents)
    context = render_context(documents)

    prompt = build_prompt(request.section_spec, request.grant)
    llm = llm or get_llm()
    chain = prompt | llm
    response = chain.invoke(
        {
            "grant_title": request.grant.title,
            "grant_sponsor": request.grant.sponsor,
            "criteria": "; ".join(request.grant.criteria),
            "section_id": request.section_spec.id,
            "section_title": request.section_spec.title,
            "section_type": request.section_spec.type.value,
            "word_max": request.section_spec.word_max or "none",
            "required_terms": ", ".join(request.section_spec.required_terms or []),
            "profile": profile.dict() if profile else {},
            "query": request.query,
            "context": context,
        }
    )
    volume = parse_volume(response.content)
    validation = validate_volume(volume, request.section_spec, request.grant)

    if not validation.passed:
        revision_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Revise the JSON to resolve the validation issues. Return JSON with the same schema.",
                ),
                (
                    "human",
                    "Previous JSON: {previous}. Issues: {issues}. Section type: {section_type}. Word cap: {word_cap}.",
                ),
            ]
        )
        revision_chain = revision_prompt | llm
        revision = revision_chain.invoke(
            {
                "previous": volume.dict(),
                "issues": "; ".join(validation.issues),
                "section_type": request.section_spec.type.value,
                "word_cap": request.section_spec.word_max or "none",
            }
        )
        try:
            revised_data = json.loads(revision.content)
            if "volume" in revised_data:
                volume = Volume(**revised_data["volume"])
                validation = validate_volume(volume, request.section_spec, request.grant)
        except Exception:
            pass

    return volume, citations, validation

