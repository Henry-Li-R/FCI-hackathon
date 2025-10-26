from __future__ import annotations

from typing import List

from .models import Grant, SectionSpec, SectionType, ValidationIssue, Volume


def _word_count(text: str) -> int:
    return len(text.split()) if text else 0


def _check_word_limit(volume: Volume, spec: SectionSpec, issues: List[str]) -> None:
    if spec.word_max and volume.body:
        if _word_count(volume.body) > spec.word_max:
            issues.append(
                f"Body exceeds word cap ({_word_count(volume.body)}>{spec.word_max})."
            )


def _check_required_terms(volume: Volume, spec: SectionSpec, grant: Grant, issues: List[str]) -> None:
    if spec.required_terms:
        body_text = volume.body or ""
        missing = [term for term in spec.required_terms if term.lower() not in body_text.lower()]
        if missing:
            issues.append(
                "Missing required terms: " + ", ".join(missing)
            )
    elif spec.id == "alignment" and grant.criteria:
        body_text = (volume.body or "").lower()
        matches = sum(1 for criterion in grant.criteria if criterion.lower() in body_text)
        required = min(3, len(grant.criteria))
        if matches < required:
            issues.append(
                f"Alignment must reference at least {required} grant criteria terms; found {matches}."
            )


def _check_budget_rows(volume: Volume, issues: List[str]) -> None:
    if not volume.rows:
        issues.append("Budget must contain rows including a contingency line.")
        return
    subtotal = 0.0
    contingency = 0.0
    for row in volume.rows:
        subtotal += row.cost
        if "contingency" in row.item.lower():
            contingency += row.cost
    if subtotal <= 0:
        issues.append("Budget subtotal must be positive.")
        return
    non_contingency = subtotal - contingency
    if non_contingency <= 0:
        issues.append("Budget requires non-contingency costs.")
        return
    min_contingency = 0.05 * non_contingency
    if contingency < min_contingency:
        issues.append(
            f"Contingency must be at least 5% of subtotal excluding contingency ({min_contingency:.2f})."
        )


def validate_volume(volume: Volume, spec: SectionSpec, grant: Grant) -> ValidationIssue:
    issues: List[str] = []

    if volume.type != spec.type:
        issues.append(f"Volume type {volume.type} does not match spec {spec.type}.")

    if spec.type == SectionType.narrative:
        if not volume.body:
            issues.append("Narrative sections must include body text.")
        else:
            _check_word_limit(volume, spec, issues)
            _check_required_terms(volume, spec, grant, issues)
    elif spec.type == SectionType.bullets:
        if not volume.items:
            issues.append("Bullet sections must include items.")
        else:
            if not (3 <= len(volume.items) <= 6):
                issues.append("Objectives must include between 3 and 6 bullet items.")
    elif spec.type == SectionType.table:
        _check_budget_rows(volume, issues)

    return ValidationIssue(passed=len(issues) == 0, issues=issues)

