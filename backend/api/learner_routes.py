from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from db.database import get_db
from db.models import (
    LearnerProfile,
    ModuleProgress,
    ExamAttempt,
    TaskAssignment,
    Certificate,
)
from core.auth import get_current_learner
from agents.base import COURSE_MODULES
from core.config import settings

router = APIRouter(prefix="/learner", tags=["learner"])


class LanguageUpdate(BaseModel):
    language: str  # en | hi | mr


@router.patch("/language")
async def update_language(
    body: LanguageUpdate,
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    learner.preferred_language = body.language
    await db.commit()
    return {"preferredLanguage": learner.preferred_language}


@router.get("/profile")
async def get_profile(
    learner: LearnerProfile = Depends(get_current_learner),
):
    return {
        "id": learner.id,
        "email": learner.email,
        "name": learner.name,
        "preferredLanguage": learner.preferred_language,
        "enrollmentDate": learner.enrollment_date.isoformat(),
        "currentModuleId": learner.current_module_id,
        "totalScore": learner.total_score,
        "certificateIssued": learner.certificate_issued,
    }


@router.get("/progress")
async def get_progress(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    total_modules = len(COURSE_MODULES)

    # Count passed modules
    passed_count = 0
    score_sum = 0.0
    for module in COURSE_MODULES:
        result = await db.execute(
            select(func.max(ExamAttempt.score)).where(
                and_(
                    ExamAttempt.learner_id == learner.id,
                    ExamAttempt.module_id == module["id"],
                    ExamAttempt.passed == True,
                )
            )
        )
        best = result.scalar()
        if best and best >= settings.pass_threshold:
            passed_count += 1
            score_sum += best

    avg_score = (score_sum / passed_count * 100) if passed_count > 0 else 0.0

    # Tasks
    task_result = await db.execute(
        select(func.count()).where(
            and_(
                TaskAssignment.learner_id == learner.id,
                TaskAssignment.status == "submitted",
            )
        )
    )
    tasks_completed = task_result.scalar() or 0

    # Certificate eligibility check
    certificate_eligible = (
        passed_count == total_modules and tasks_completed >= total_modules
    )

    return {
        "totalModules": total_modules,
        "completedModules": passed_count,
        "averageScore": round(avg_score, 1),
        "tasksCompleted": tasks_completed,
        "totalTasks": total_modules,
        "certificateEligible": certificate_eligible,
    }


@router.get("/modules")
async def get_modules(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    modules_out = []
    for i, module in enumerate(COURSE_MODULES):
        # Get best passed score
        result = await db.execute(
            select(func.max(ExamAttempt.score)).where(
                and_(
                    ExamAttempt.learner_id == learner.id,
                    ExamAttempt.module_id == module["id"],
                    ExamAttempt.passed == True,
                )
            )
        )
        best_score = result.scalar()
        passed = bool(best_score and best_score >= settings.pass_threshold)

        # Determine status
        if passed:
            status_val = "completed"
        elif module["id"] == learner.current_module_id:
            status_val = "in_progress"
        elif i == 0 or modules_out[-1]["status"] in ("completed", "in_progress"):
            status_val = "available"
        else:
            status_val = "locked"

        modules_out.append({
            "id": module["id"],
            "title": module["title"],
            "description": module["description"],
            "order": i + 1,
            "status": status_val,
            "score": round(best_score * 100) if best_score else None,
        })

    return modules_out


@router.get("/tasks")
async def get_tasks(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TaskAssignment)
        .where(TaskAssignment.learner_id == learner.id)
        .order_by(TaskAssignment.assigned_at.desc())
    )
    tasks = result.scalars().all()
    return [
        {
            "id": t.id,
            "moduleId": t.module_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "assignedAt": t.assigned_at.isoformat(),
            "submittedAt": t.submitted_at.isoformat() if t.submitted_at else None,
        }
        for t in tasks
    ]


@router.get("/certificate")
async def get_certificate(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Certificate).where(Certificate.learner_id == learner.id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not yet issued",
        )
    import os
    filename = os.path.basename(cert.pdf_path) if cert.pdf_path else ""
    return {
        "url": f"/certificates/{filename}" if filename else "",
        "issuedAt": cert.issued_at.isoformat(),
    }
