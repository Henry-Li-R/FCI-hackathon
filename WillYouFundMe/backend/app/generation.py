from __future__ import annotations

import json
import os
from typing import List, Optional, Tuple

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

from .models import Grant, Profile, SectionRequest, SectionSpec, ValidationIssue, Volume
from .rag import format_citations, retrieve_chunks
from .validation import validate_volume


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
    '"body": null, "items": null, "rows": null}, "rationale": ""}'
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


def parse_volume(raw_text: str) -> Volume:
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError("LLM response was not valid JSON") from exc
    volume_payload = data.get("volume", {})
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

