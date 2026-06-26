"""
Persona Mapper — classifies a learner into one of 9 personas and generates
a personalised JSONB module_sequence for course_enrollments.

Deterministic Python handles clear cases.
Falls back to Claude Haiku for ambiguous profiles.
"""

from __future__ import annotations
import json
from typing import Optional
from anthropic import AsyncAnthropic

from core.config import settings

_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


# ── Persona definitions ───────────────────────────────────────────────────────

PERSONAS = [
    "Marketing & Growth Pro",
    "Business & Strategy Leader",
    "Technical Practitioner",
    "Healthcare Professional",
    "Finance & Banking",
    "Student — Placement Bound",
    "Student — Curiosity Driven",
    "Career Changer",
    "General Learner",
]

# Default variant for each persona, plus per-module overrides
PERSONA_VARIANT_MAP: dict[str, dict] = {
    "Marketing & Growth Pro":       {"default": "applied",  "overrides": {}},
    "Business & Strategy Leader":   {"default": "applied",  "overrides": {}},
    "Technical Practitioner":       {"default": "deep",     "overrides": {"0": "core"}},
    "Healthcare Professional":      {"default": "applied",  "overrides": {}},
    "Finance & Banking":            {"default": "applied",  "overrides": {}},
    "Student — Placement Bound":    {"default": "applied",  "overrides": {"0": "core"}},
    "Student — Curiosity Driven":   {"default": "core",     "overrides": {"2": "deep", "3": "deep"}},
    "Career Changer":               {"default": "applied",  "overrides": {}},
    "General Learner":              {"default": "core",     "overrides": {}},
}


# ── Deterministic classifier ──────────────────────────────────────────────────

def _classify_deterministic(
    employment_status: Optional[str],
    job_role: Optional[str],
    target_job_role: Optional[str],
    industry: Optional[str],
    objective_tags: Optional[list],
    graduation_year: Optional[int],
) -> Optional[str]:
    role = (job_role or target_job_role or "").lower()
    ind  = (industry or "").lower()
    tags = [t.lower() for t in (objective_tags or [])]
    status = (employment_status or "").lower()

    # Marketing
    if any(w in role for w in ["marketing", "growth", "brand", "content", "seo",
                                "social media", "digital marketing", "advertising"]):
        return "Marketing & Growth Pro"

    # Technical
    if any(w in role for w in ["engineer", "developer", "programmer", "coder",
                                "data scientist", "data analyst", "ml engineer",
                                "software", "devops", "backend", "frontend", "fullstack"]):
        return "Technical Practitioner"

    # Business / Leadership
    if any(w in role for w in ["founder", "ceo", "coo", "cto", "director", "vp ",
                                "president", "consulting", "consultant", "strategy",
                                "product manager", "product owner", "operations"]):
        return "Business & Strategy Leader"

    # Healthcare
    if any(w in ind for w in ["health", "medical", "pharma", "hospital", "clinic"]) or \
       any(w in role for w in ["doctor", "nurse", "physician", "surgeon", "pharmacist",
                                "therapist", "dentist"]):
        return "Healthcare Professional"

    # Finance
    if any(w in ind for w in ["banking", "finance", "bfsi", "insurance", "fintech",
                               "investment", "capital"]) or \
       any(w in role for w in ["banker", "ca ", "chartered accountant", "trader",
                                "portfolio", "wealth", "actuary", "auditor"]):
        return "Finance & Banking"

    # Students
    if status == "studying":
        current_year = 2026
        if graduation_year and graduation_year <= current_year + 1:
            return "Student — Placement Bound"
        if "curiosity" in tags:
            return "Student — Curiosity Driven"
        return "Student — Placement Bound"   # default for students

    # Career changer
    if "career_change" in tags or status == "between_jobs":
        return "Career Changer"

    return None   # ambiguous → use Haiku


# ── Haiku fallback ────────────────────────────────────────────────────────────

async def _classify_haiku(profile_summary: str) -> str:
    try:
        if not settings.anthropic_api_key:
            return "General Learner"

        prompt = f"""You are a learner persona classifier for an AI literacy platform.

Given the learner profile below, classify them into EXACTLY ONE of these 9 personas:
{chr(10).join(f"- {p}" for p in PERSONAS)}

Learner profile:
{profile_summary}

Respond with ONLY the persona name, exactly as written above. Nothing else."""

        msg = await _get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=30,
            messages=[{"role": "user", "content": prompt}],
        )
        result = msg.content[0].text.strip()
        return result if result in PERSONAS else "General Learner"
    except Exception:
        return "General Learner"


# ── Public API ────────────────────────────────────────────────────────────────

async def classify_persona(
    employment_status: Optional[str],
    job_role: Optional[str],
    target_job_role: Optional[str],
    industry: Optional[str],
    objective_tags: Optional[list],
    graduation_year: Optional[int],
    learning_objective: Optional[str] = None,
) -> str:
    """Return one of the 9 persona strings."""
    persona = _classify_deterministic(
        employment_status, job_role, target_job_role,
        industry, objective_tags, graduation_year,
    )
    if persona:
        return persona

    # Build a short summary for Haiku
    parts = []
    if employment_status:
        parts.append(f"Status: {employment_status}")
    if job_role:
        parts.append(f"Job role: {job_role}")
    if target_job_role:
        parts.append(f"Target role: {target_job_role}")
    if industry:
        parts.append(f"Industry: {industry}")
    if learning_objective:
        parts.append(f"Learning goal: {learning_objective}")
    if objective_tags:
        parts.append(f"Tags: {', '.join(objective_tags)}")

    summary = "\n".join(parts) or "No profile information provided."
    return await _classify_haiku(summary)


def build_module_sequence(persona: str, modules: list[dict]) -> list[dict]:
    """
    Given a persona and an ordered list of module dicts (with 'id' and 'order_index'),
    return the JSONB module_sequence:
    [{"module_id": "uuid", "order_index": 0, "variant": "core|applied|deep"}, ...]
    """
    mapping = PERSONA_VARIANT_MAP.get(persona, PERSONA_VARIANT_MAP["General Learner"])
    default_variant: str = mapping["default"]
    overrides: dict[str, str] = mapping["overrides"]   # key = str(order_index)

    sequence = []
    for mod in sorted(modules, key=lambda m: m["order_index"]):
        variant = overrides.get(str(mod["order_index"]), default_variant)
        sequence.append({
            "module_id": mod["id"],
            "order_index": mod["order_index"],
            "title": mod["title"],
            "variant": variant,
        })
    return sequence
