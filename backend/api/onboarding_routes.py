"""
Onboarding routes — handle the 5-question mandatory quiz + 3 optional questions.
After submission: classify persona → generate module_sequence → create CourseEnrollment.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from core.auth import get_current_learner
from db.database import get_db
from db.models import (
    Course,
    CourseEnrollment,
    CourseModule,
    LearnerLearningContext,
    LearnerProfessionalContext,
    LearnerProfile,
)
from db.persona_mapper import build_module_sequence, classify_persona

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


# ── Status check ──────────────────────────────────────────────────────────────

@router.get("/status")
async def onboarding_status(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns whether the learner has completed onboarding.
    The frontend calls this on every dashboard load to decide whether to redirect.
    """
    prof_result = await db.execute(
        select(LearnerProfessionalContext).where(LearnerProfessionalContext.learner_id == learner.id)
    )
    prof = prof_result.scalar_one_or_none()
    # We consider onboarding done if the professional context row exists
    # (it's created on first submit, even if partial)
    completed = prof is not None

    # Also return persona + enrollment if they exist
    enroll = None
    if completed:
        result = await db.execute(
            select(CourseEnrollment).where(CourseEnrollment.learner_id == learner.id)
        )
        row = result.scalar_one_or_none()
        if row:
            enroll = {
                "courseId": row.course_id,
                "persona": row.persona_label,
                "paymentStatus": row.payment_status,
            }

    return {"completed": completed, "enrollment": enroll}


# ── Submit ────────────────────────────────────────────────────────────────────

class OnboardingSubmit(BaseModel):
    # Mandatory
    employment_status: str              # working|studying|between_jobs|freelancing
    job_role: Optional[str] = None      # current role (if working)
    target_job_role: Optional[str] = None  # desired role (if studying/changing)
    industry: Optional[str] = None
    learning_objective: str             # free text
    daily_time_mins: int = 30           # 15|30|45|60

    # Optional (skippable)
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    hometown: Optional[str] = None
    prior_ai_exposure: Optional[str] = None  # none|basic|intermediate|advanced

    # Derived on backend from learning_objective text
    objective_tags: Optional[list[str]] = None


def _infer_tags(objective: str, employment_status: str) -> list[str]:
    """Simple keyword-based tag inference from free-text learning objective."""
    obj = objective.lower()
    tags: list[str] = []
    if any(w in obj for w in ["switch", "change career", "transition", "new field"]):
        tags.append("career_change")
    if any(w in obj for w in ["curious", "interest", "explore", "learn about", "understand"]):
        tags.append("curiosity")
    if any(w in obj for w in ["job", "placement", "interview", "hire", "hired", "campus"]):
        tags.append("placement")
    if any(w in obj for w in ["work", "productivity", "tool", "automate", "my job"]):
        tags.append("work_use")
    if any(w in obj for w in ["certif", "course", "credential"]):
        tags.append("certification")
    if employment_status in ("between_jobs",):
        if "career_change" not in tags:
            tags.append("career_change")
    return tags or ["general"]


@router.post("/submit")
async def submit_onboarding(
    body: OnboardingSubmit,
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    # Infer tags if not provided
    tags = body.objective_tags or _infer_tags(body.learning_objective, body.employment_status)

    # Upsert professional context
    prof_result = await db.execute(
        select(LearnerProfessionalContext).where(LearnerProfessionalContext.learner_id == learner.id)
    )
    prof = prof_result.scalar_one_or_none()
    if not prof:
        prof = LearnerProfessionalContext(learner_id=learner.id)
        db.add(prof)

    prof.employment_status  = body.employment_status
    prof.job_role           = body.job_role
    prof.target_job_role    = body.target_job_role
    prof.industry           = body.industry
    prof.college            = body.college
    prof.degree             = body.degree
    prof.graduation_year    = body.graduation_year
    prof.hometown           = body.hometown
    prof.prior_ai_exposure  = body.prior_ai_exposure

    # Upsert learning context
    learn_result = await db.execute(
        select(LearnerLearningContext).where(LearnerLearningContext.learner_id == learner.id)
    )
    learn = learn_result.scalar_one_or_none()
    if not learn:
        learn = LearnerLearningContext(learner_id=learner.id)
        db.add(learn)

    learn.learning_objective = body.learning_objective
    learn.objective_tags     = tags
    learn.daily_time_mins    = body.daily_time_mins

    await db.flush()

    # Classify persona
    persona = await classify_persona(
        employment_status=body.employment_status,
        job_role=body.job_role,
        target_job_role=body.target_job_role,
        industry=body.industry,
        objective_tags=tags,
        graduation_year=body.graduation_year,
        learning_objective=body.learning_objective,
    )

    # Load first course (or skip if no courses seeded yet)
    result = await db.execute(select(Course).limit(1))
    course = result.scalar_one_or_none()

    enrollment = None
    if course:
        # Load course modules
        mods_result = await db.execute(
            select(CourseModule)
            .where(CourseModule.course_id == course.id)
            .order_by(CourseModule.order_index)
        )
        modules = [
            {"id": m.id, "order_index": m.order_index, "title": m.title}
            for m in mods_result.scalars().all()
        ]

        module_sequence = build_module_sequence(persona, modules)

        # Upsert enrollment
        enroll_result = await db.execute(
            select(CourseEnrollment).where(
                CourseEnrollment.learner_id == learner.id,
                CourseEnrollment.course_id == course.id,
            )
        )
        enrollment = enroll_result.scalar_one_or_none()
        if not enrollment:
            enrollment = CourseEnrollment(
                learner_id=learner.id,
                course_id=course.id,
                persona_label=persona,
                module_sequence=module_sequence,
                payment_status="pending",
            )
            db.add(enrollment)
        else:
            # Re-classify if profile changes
            enrollment.persona_label    = persona
            enrollment.module_sequence  = module_sequence

    await db.commit()

    return {
        "persona": persona,
        "courseId": course.id if course else None,
        "moduleSequence": enrollment.module_sequence if enrollment else [],
        "message": f"Welcome! You've been classified as: {persona}",
    }
