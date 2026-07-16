from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import anthropic
from core.auth import get_current_learner
from core.config import settings
from db.database import get_db
from db.models import (
    Course,
    CourseModule,
    LearnerProfile,
    LessonAssignmentSubmission,
    Section,
    Video,
    VideoLanguageVariant,
    VideoProgress,
)

router = APIRouter(prefix="/courses", tags=["courses"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _progress_map(video: Video, learner_id: str) -> Optional[VideoProgress]:
    """Return the VideoProgress record for a given learner, or None."""
    return next(
        (p for p in video.progress_records if p.learner_id == learner_id),
        None,
    )


def _pick_cloudinary_id(video: Video, language: str) -> Optional[str]:
    """Return the Cloudinary public ID for the requested language.

    Priority: exact language match → 'en' fallback → base video field.
    """
    variants = {v.language: v for v in (video.language_variants or [])}
    if language in variants:
        return variants[language].cloudinary_public_id
    if "en" in variants:
        return variants["en"].cloudinary_public_id
    return video.cloudinary_public_id  # legacy / not yet uploaded per-language


def _pick_duration(video: Video, language: str) -> Optional[int]:
    """Return duration for the selected language variant, falling back to base."""
    variants = {v.language: v for v in (video.language_variants or [])}
    if language in variants and variants[language].duration_seconds:
        return variants[language].duration_seconds
    if "en" in variants and variants["en"].duration_seconds:
        return variants["en"].duration_seconds
    return video.duration_seconds


def _all_videos_completed_in_level(modules: list, level: int, learner_id: str) -> bool:
    """Return True if every video in the given level is completed by this learner."""
    for mod in modules:
        if mod.level != level:
            continue
        for sec in mod.sections:
            for video in sec.videos:
                prog = _progress_map(video, learner_id)
                if not (prog and prog.completed):
                    return False
    return True


def _build_course_response(course: Course, learner_id: str, language: str = "en") -> dict:
    """Serialize a fully-loaded Course with per-learner unlock + progress state.

    Level-based access rules:
    - Within a level, ALL modules/sections are freely accessible simultaneously.
    - To advance to the next level, the learner must complete every video in the
      current level (agent gate handled separately by the agent system).
    - Videos are served in the learner's preferred language where a variant exists.
    """
    modules = course.modules  # already ordered by order_index

    # Determine which levels are unlocked
    # Level 1 is always unlocked. Level N (N>1) is unlocked when level N-1 is done.
    unlocked_levels: set[int] = {1}
    for level in (2, 3):
        if _all_videos_completed_in_level(modules, level - 1, learner_id):
            unlocked_levels.add(level)

    modules_out = []

    for module in modules:
        level_unlocked = module.level in unlocked_levels
        sections_out = []

        for section in module.sections:
            videos_out = []
            section_all_complete = True

            for video in section.videos:
                prog = _progress_map(video, learner_id)
                watched   = prog.watched_seconds  if prog else 0
                dur_saved = prog.duration_seconds if prog else 0
                completed = prog.completed        if prog else False

                if not completed:
                    section_all_complete = False

                duration  = _pick_duration(video, language)

                videos_out.append({
                    "id": video.id,
                    "title": video.title,
                    "cloudinaryPublicId": _pick_cloudinary_id(video, language),
                    "durationSeconds": duration,
                    "thumbnailCloudinaryId": video.thumbnail_cloudinary_id,
                    "orderIndex": video.order_index,
                    "watchedSeconds": watched,
                    "durationSavedSeconds": dur_saved or duration or 0,
                    "completed": completed,
                    "unlocked": level_unlocked,
                })

            sections_out.append({
                "id": section.id,
                "title": section.title,
                "orderIndex": section.order_index,
                "videos": videos_out,
                "completed": section_all_complete and len(videos_out) > 0,
                "unlocked": level_unlocked,
            })

        modules_out.append({
            "id": module.id,
            "title": module.title,
            "outcome": module.outcome,
            "orderIndex": module.order_index,
            "level": module.level,
            "sections": sections_out,
            "unlocked": level_unlocked,
        })

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnailCloudinaryId": course.thumbnail_cloudinary_id,
        "modules": modules_out,
    }


async def _load_course(course_id: str, db: AsyncSession) -> Course:
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.modules)
            .selectinload(CourseModule.sections)
            .selectinload(Section.videos)
            .selectinload(Video.progress_records),
            selectinload(Course.modules)
            .selectinload(CourseModule.sections)
            .selectinload(Section.videos)
            .selectinload(Video.language_variants),
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# ── routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_courses(
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course).options(selectinload(Course.modules))
    )
    courses = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "thumbnailCloudinaryId": c.thumbnail_cloudinary_id,
            "moduleCount": len(c.modules),
        }
        for c in courses
    ]


@router.get("/{course_id}")
async def get_course(
    course_id: str,
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    course = await _load_course(course_id, db)
    return _build_course_response(course, learner.id, learner.preferred_language or "en")


@router.get("/{course_id}/continue")
async def continue_watching(
    course_id: str,
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Return the video the learner should watch next."""
    course = await _load_course(course_id, db)

    last_started: Optional[dict] = None
    first_unwatched: Optional[dict] = None
    prev_section_completed = True

    for module in course.modules:
        for section in module.sections:
            if not prev_section_completed:
                break

            section_all_complete = True
            for video in section.videos:
                prog = _progress_map(video, learner.id)
                completed = prog.completed if prog else False

                if not completed:
                    section_all_complete = False

                lang = learner.preferred_language or "en"
                if prog and not completed and prog.watched_seconds > 0:
                    # In-progress video — highest priority
                    last_started = {
                        "courseId": course_id,
                        "courseTitle": course.title,
                        "moduleTitle": module.title,
                        "sectionTitle": section.title,
                        "videoId": video.id,
                        "videoTitle": video.title,
                        "cloudinaryPublicId": _pick_cloudinary_id(video, lang),
                        "durationSeconds": _pick_duration(video, lang) or 0,
                        "watchedSeconds": prog.watched_seconds,
                        "thumbnailCloudinaryId": video.thumbnail_cloudinary_id,
                    }
                elif not prog and first_unwatched is None:
                    first_unwatched = {
                        "courseId": course_id,
                        "courseTitle": course.title,
                        "moduleTitle": module.title,
                        "sectionTitle": section.title,
                        "videoId": video.id,
                        "videoTitle": video.title,
                        "cloudinaryPublicId": _pick_cloudinary_id(video, lang),
                        "durationSeconds": _pick_duration(video, lang) or 0,
                        "watchedSeconds": 0,
                        "thumbnailCloudinaryId": video.thumbnail_cloudinary_id,
                    }

            prev_section_completed = section_all_complete and len(section.videos) > 0

    return last_started or first_unwatched


# ── progress update ───────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    watched_seconds: int
    duration_seconds: int


@router.post("/videos/{video_id}/progress")
async def update_video_progress(
    video_id: str,
    body: ProgressUpdate,
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoProgress).where(
            and_(
                VideoProgress.learner_id == learner.id,
                VideoProgress.video_id == video_id,
            )
        )
    )
    prog = result.scalar_one_or_none()

    completed = (
        body.duration_seconds > 0
        and (body.watched_seconds / body.duration_seconds) >= 0.9
    )
    now = datetime.utcnow()

    if prog:
        if body.watched_seconds > prog.watched_seconds:
            prog.watched_seconds = body.watched_seconds
            prog.duration_seconds = body.duration_seconds
        if completed and not prog.completed:
            prog.completed = True
            prog.completed_at = now
        prog.last_watched_at = now
    else:
        prog = VideoProgress(
            learner_id=learner.id,
            video_id=video_id,
            watched_seconds=body.watched_seconds,
            duration_seconds=body.duration_seconds,
            completed=completed,
            completed_at=now if completed else None,
            last_watched_at=now,
        )
        db.add(prog)

    await db.commit()
    return {"completed": prog.completed, "watchedSeconds": prog.watched_seconds}


# ── assignment evaluation ─────────────────────────────────────────────────────

import base64, io, json, re
from fastapi import File, Form, UploadFile


def _extract_text_from_pdf(data: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def _extract_text_from_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs).strip()


@router.post("/assignments/evaluate")
async def evaluate_assignment(
    file: UploadFile = File(...),
    lesson_title: str = Form(...),
    assignment_id: str = Form(...),
    question: str = Form(...),
    rubric: str = Form(...),
    lang: str = Form("en"),
    learner: LearnerProfile = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()

    lang_instruction = {
        "hi": "Respond entirely in Hindi (Devanagari script).",
        "mr": "Respond entirely in Marathi (Devanagari script).",
        "te": "Respond entirely in Telugu.",
        "ta": "Respond entirely in Tamil.",
        "kn": "Respond entirely in Kannada.",
    }.get(lang, "Respond in English.")

    eval_prompt = f"""You are an expert educational evaluator for an AI literacy course for Indian freshers.

Assignment question:
{question}

Rubric (use this to assign the score):
{rubric}

{lang_instruction}

Respond ONLY with valid JSON in this exact shape — no markdown, no extra text:
{{"score": <integer 0-100>, "feedback": "<2-3 sentence feedback string>"}}"""

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    is_image = content_type.startswith("image/") or filename.endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))

    if is_image:
        # Use Claude vision — pass the image directly
        media_type = content_type if content_type.startswith("image/") else "image/jpeg"
        img_b64 = base64.standard_b64encode(data).decode()
        message = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": img_b64},
                    },
                    {"type": "text", "text": eval_prompt},
                ],
            }],
        )
        answer_summary = "[image submission]"
    else:
        # Extract text from PDF or DOCX
        if filename.endswith(".pdf") or "pdf" in content_type:
            extracted = _extract_text_from_pdf(data)
        elif filename.endswith((".docx", ".doc")) or "word" in content_type or "openxmlformats" in content_type:
            extracted = _extract_text_from_docx(data)
        else:
            raise HTTPException(status_code=415, detail="Unsupported file type. Upload an image, PDF, or Word document.")

        if not extracted:
            raise HTTPException(status_code=422, detail="Could not extract text from the file.")

        full_prompt = eval_prompt + f"\n\nLearner's answer (extracted from document):\n{extracted}"
        message = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            messages=[{"role": "user", "content": full_prompt}],
        )
        answer_summary = extracted[:2000]  # store first 2000 chars

    raw = message.content[0].text.strip()
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not json_match:
        raise HTTPException(status_code=502, detail="Evaluator returned unexpected format.")
    result = json.loads(json_match.group())
    score = max(0, min(100, int(result.get("score", 0))))
    feedback = result.get("feedback", "")

    submission = LessonAssignmentSubmission(
        learner_id=learner.id,
        lesson_title=lesson_title,
        assignment_id=assignment_id,
        answer=answer_summary,
        score=float(score),
        feedback=feedback,
    )
    db.add(submission)
    await db.commit()

    return {"score": score, "feedback": feedback}
