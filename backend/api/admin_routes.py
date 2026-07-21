"""
Admin portal endpoints (hidden /admin). Single shared password → admin JWT.

Everything except /admin/login requires a valid admin token (require_admin).

  POST   /admin/login                         — password → admin token
  GET    /admin/courses                       — full course tree
  POST   /admin/courses                       — create course
  PUT    /admin/courses/{id}                  — rename / describe
  DELETE /admin/courses/{id}                  — delete course (cascades)
  POST   /admin/modules                       — add module to a course
  PUT    /admin/modules/{id} / DELETE
  POST   /admin/sections                      — add section to a module
  PUT    /admin/sections/{id} / DELETE
  POST   /admin/videos                        — add lesson to a section
  PUT    /admin/videos/{id} / DELETE
  PUT    /admin/videos/{id}/variant           — set a per-language Cloudinary id
  DELETE /admin/videos/{id}/variant/{lang}
  POST   /admin/cloudinary/signature          — signed direct-upload params
"""
import hashlib
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.auth import create_admin_token, require_admin
from core.config import settings
from db.database import get_db
from db.models import (
    Course, CourseModule, Section, Video, VideoLanguageVariant, VideoProgress,
    QuizQuestion, AssignmentPrompt,
)

router = APIRouter(prefix="/admin", tags=["admin"])

SUPPORTED_LANGUAGES = {"en", "hi", "mr", "te", "ta", "kn"}

# Cloudinary IDs that already exist and are used by the learner site / WhatsApp,
# keyed by lesson title. /admin/sync-videos imports these into the DB so they
# show up (and become editable) in the portal.
KNOWN_VIDEO_IDS = {
    "The 10 AI Words Every Fresher Must Know": {
        "en": "2.1_English_compressed_s6vhdd",
        "hi": "2.1_hindi_sixgnf",
        "mr": "2.1_Marathi_cws5fc",
        "te": "2.1_Telugu_qloes6",
        "ta": "2.1_tamil_tl4rf2",
        "kn": "2.1_Kannada_azgabe",
    },
    "When AI Confidently Lies - Hallucination": {
        "hi": "2.4_hindi_compressed_vxkloy",
    },
}


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginBody(BaseModel):
    password: str


@router.post("/login")
async def admin_login(body: LoginBody):
    if not settings.admin_password or body.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"access_token": create_admin_token(), "token_type": "bearer"}


# ── Serialization ──────────────────────────────────────────────────────────────
def _video_dict(v: Video) -> dict:
    return {
        "id": v.id,
        "title": v.title,
        "orderIndex": v.order_index,
        "baseCloudinaryId": v.cloudinary_public_id,
        "durationSeconds": v.duration_seconds,
        "variants": [
            {"language": lv.language, "cloudinaryPublicId": lv.cloudinary_public_id,
             "durationSeconds": lv.duration_seconds}
            for lv in sorted(v.language_variants, key=lambda x: x.language)
        ],
    }


def _course_tree(c: Course) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "thumbnailCloudinaryId": c.thumbnail_cloudinary_id,
        "modules": [
            {
                "id": m.id, "title": m.title, "outcome": m.outcome,
                "orderIndex": m.order_index, "level": m.level,
                "sections": [
                    {
                        "id": s.id, "title": s.title, "orderIndex": s.order_index,
                        "videos": [_video_dict(v) for v in sorted(s.videos, key=lambda x: x.order_index)],
                    }
                    for s in sorted(m.sections, key=lambda x: x.order_index)
                ],
            }
            for m in sorted(c.modules, key=lambda x: x.order_index)
        ],
    }


_FULL_TREE = (
    selectinload(Course.modules)
    .selectinload(CourseModule.sections)
    .selectinload(Section.videos)
    .selectinload(Video.language_variants)
)


async def _load_course(course_id: str, db: AsyncSession) -> Course:
    res = await db.execute(select(Course).options(_FULL_TREE).where(Course.id == course_id))
    course = res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


async def _next_order(db: AsyncSession, model, fk_col, fk_val) -> int:
    res = await db.execute(select(func.coalesce(func.max(model.order_index), -1)).where(fk_col == fk_val))
    return int(res.scalar() or -1) + 1


# ── Courses ─────────────────────────────────────────────────────────────────────
@router.get("/courses")
async def list_courses(_: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Course).options(_FULL_TREE).order_by(Course.created_at))
    return [_course_tree(c) for c in res.scalars().all()]


class CourseBody(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_cloudinary_id: Optional[str] = None


@router.post("/courses")
async def create_course(body: CourseBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    course = Course(title=body.title, description=body.description,
                    thumbnail_cloudinary_id=body.thumbnail_cloudinary_id)
    db.add(course)
    await db.commit()
    return await _tree(course.id, db)


@router.put("/courses/{course_id}")
async def update_course(course_id: str, body: CourseBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    course = await _load_course(course_id, db)
    course.title = body.title
    course.description = body.description
    if body.thumbnail_cloudinary_id is not None:
        course.thumbnail_cloudinary_id = body.thumbnail_cloudinary_id
    await db.commit()
    return await _tree(course_id, db)


@router.delete("/courses/{course_id}")
async def delete_course(course_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    module_ids = select(CourseModule.id).where(CourseModule.course_id == course_id)
    section_ids = select(Section.id).where(Section.module_id.in_(module_ids))
    video_ids = select(Video.id).where(Video.section_id.in_(section_ids))
    await db.execute(delete(VideoLanguageVariant).where(VideoLanguageVariant.video_id.in_(video_ids)))
    await db.execute(delete(VideoProgress).where(VideoProgress.video_id.in_(video_ids)))
    await db.execute(delete(Video).where(Video.section_id.in_(section_ids)))
    await db.execute(delete(Section).where(Section.module_id.in_(module_ids)))
    await db.execute(delete(CourseModule).where(CourseModule.course_id == course_id))
    await db.execute(delete(Course).where(Course.id == course_id))
    await db.commit()
    return {"deleted": True, "courseId": course_id}


# ── Modules ─────────────────────────────────────────────────────────────────────
class ModuleBody(BaseModel):
    course_id: Optional[str] = None
    title: str
    outcome: Optional[str] = None
    level: int = 1


@router.post("/modules")
async def create_module(body: ModuleBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not body.course_id:
        raise HTTPException(status_code=400, detail="course_id is required")
    order = await _next_order(db, CourseModule, CourseModule.course_id, body.course_id)
    m = CourseModule(course_id=body.course_id, title=body.title, outcome=body.outcome,
                     level=body.level, order_index=order)
    db.add(m)
    await db.commit()
    return await _tree(body.course_id, db)


@router.put("/modules/{module_id}")
async def update_module(module_id: str, body: ModuleBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    m = await db.get(CourseModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    m.title = body.title
    m.outcome = body.outcome
    m.level = body.level
    await db.commit()
    return await _tree(m.course_id, db)


@router.delete("/modules/{module_id}")
async def delete_module(module_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    m = await db.get(CourseModule, module_id)
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = m.course_id
    section_ids = select(Section.id).where(Section.module_id == module_id)
    video_ids = select(Video.id).where(Video.section_id.in_(section_ids))
    await db.execute(delete(VideoLanguageVariant).where(VideoLanguageVariant.video_id.in_(video_ids)))
    await db.execute(delete(VideoProgress).where(VideoProgress.video_id.in_(video_ids)))
    await db.execute(delete(Video).where(Video.section_id.in_(section_ids)))
    await db.execute(delete(Section).where(Section.module_id == module_id))
    await db.execute(delete(CourseModule).where(CourseModule.id == module_id))
    await db.commit()
    return await _tree(course_id, db)


# ── Sections ────────────────────────────────────────────────────────────────────
class SectionBody(BaseModel):
    module_id: Optional[str] = None
    title: str


@router.post("/sections")
async def create_section(body: SectionBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not body.module_id:
        raise HTTPException(status_code=400, detail="module_id is required")
    m = await db.get(CourseModule, body.module_id)
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    order = await _next_order(db, Section, Section.module_id, body.module_id)
    s = Section(module_id=body.module_id, title=body.title, order_index=order)
    db.add(s)
    await db.commit()
    return await _tree(m.course_id, db)


@router.put("/sections/{section_id}")
async def update_section(section_id: str, body: SectionBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    s = await db.get(Section, section_id)
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    s.title = body.title
    m = await db.get(CourseModule, s.module_id)
    await db.commit()
    return await _tree(m.course_id, db)


@router.delete("/sections/{section_id}")
async def delete_section(section_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    s = await db.get(Section, section_id)
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    m = await db.get(CourseModule, s.module_id)
    video_ids = select(Video.id).where(Video.section_id == section_id)
    await db.execute(delete(VideoLanguageVariant).where(VideoLanguageVariant.video_id.in_(video_ids)))
    await db.execute(delete(VideoProgress).where(VideoProgress.video_id.in_(video_ids)))
    await db.execute(delete(Video).where(Video.section_id == section_id))
    await db.execute(delete(Section).where(Section.id == section_id))
    await db.commit()
    return await _tree(m.course_id, db)


# ── Videos (lessons) ────────────────────────────────────────────────────────────
class VideoBody(BaseModel):
    section_id: Optional[str] = None
    title: str
    cloudinary_public_id: Optional[str] = None
    duration_seconds: Optional[int] = None


@router.post("/videos")
async def create_video(body: VideoBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not body.section_id:
        raise HTTPException(status_code=400, detail="section_id is required")
    s = await db.get(Section, body.section_id)
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    order = await _next_order(db, Video, Video.section_id, body.section_id)
    v = Video(section_id=body.section_id, title=body.title,
              cloudinary_public_id=body.cloudinary_public_id,
              duration_seconds=body.duration_seconds, order_index=order)
    db.add(v)
    await db.commit()
    m = await db.get(CourseModule, s.module_id)
    return await _tree(m.course_id, db)


@router.put("/videos/{video_id}")
async def update_video(video_id: str, body: VideoBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    v.title = body.title
    if body.cloudinary_public_id is not None:
        v.cloudinary_public_id = body.cloudinary_public_id
    if body.duration_seconds is not None:
        v.duration_seconds = body.duration_seconds
    s = await db.get(Section, v.section_id)
    m = await db.get(CourseModule, s.module_id)
    await db.commit()
    return await _tree(m.course_id, db)


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    s = await db.get(Section, v.section_id)
    m = await db.get(CourseModule, s.module_id)
    await db.execute(delete(VideoLanguageVariant).where(VideoLanguageVariant.video_id == video_id))
    await db.execute(delete(VideoProgress).where(VideoProgress.video_id == video_id))
    await db.execute(delete(Video).where(Video.id == video_id))
    await db.commit()
    return await _tree(m.course_id, db)


# ── Per-language video variants ──────────────────────────────────────────────────
class VariantBody(BaseModel):
    language: str
    cloudinary_public_id: str
    duration_seconds: Optional[int] = None


@router.put("/videos/{video_id}/variant")
async def upsert_variant(video_id: str, body: VariantBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if body.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language. Supported: {sorted(SUPPORTED_LANGUAGES)}")
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video not found")
    res = await db.execute(select(VideoLanguageVariant).where(
        VideoLanguageVariant.video_id == video_id, VideoLanguageVariant.language == body.language))
    variant = res.scalar_one_or_none()
    if variant:
        variant.cloudinary_public_id = body.cloudinary_public_id
        if body.duration_seconds is not None:
            variant.duration_seconds = body.duration_seconds
    else:
        db.add(VideoLanguageVariant(video_id=video_id, language=body.language,
                                    cloudinary_public_id=body.cloudinary_public_id,
                                    duration_seconds=body.duration_seconds))
    await db.commit()
    return {"ok": True, "videoId": video_id, "language": body.language}


@router.delete("/videos/{video_id}/variant/{language}")
async def delete_variant(video_id: str, language: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(VideoLanguageVariant).where(
        VideoLanguageVariant.video_id == video_id, VideoLanguageVariant.language == language))
    variant = res.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    await db.delete(variant)
    await db.commit()
    return {"deleted": True, "videoId": video_id, "language": language}


# ── Cloudinary signed direct upload ───────────────────────────────────────────────
class SignatureBody(BaseModel):
    folder: Optional[str] = None


@router.post("/cloudinary/signature")
async def cloudinary_signature(body: SignatureBody, _: bool = Depends(require_admin)):
    """Return params for a signed direct browser→Cloudinary upload. The api_secret
    never leaves the server — only the derived signature does."""
    if not settings.cloudinary_api_key or not settings.cloudinary_api_secret:
        raise HTTPException(status_code=400,
                            detail="Cloudinary upload is not configured on the server (missing API key/secret).")
    ts = int(time.time())
    folder = body.folder or "cosmoplex/lessons"
    # Sign the params Cloudinary will receive (alphabetical), then append api_secret.
    to_sign = f"folder={folder}&timestamp={ts}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()
    return {
        "timestamp": ts,
        "signature": signature,
        "apiKey": settings.cloudinary_api_key,
        "cloudName": settings.cloudinary_cloud_name,
        "folder": folder,
        "uploadUrl": f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/video/upload",
    }


# ── Quiz bank (per lesson) ───────────────────────────────────────────────────
class QuizBody(BaseModel):
    question: dict                 # {"en": "...", "hi": "...", ...}
    options: dict                  # {"en": ["a","b","c","d"], ...}
    correct_index: int


def _quiz_dict(q: QuizQuestion) -> dict:
    return {"id": q.id, "question": q.question, "options": q.options,
            "correctIndex": q.correct_index, "orderIndex": q.order_index}


@router.get("/videos/{video_id}/quizzes")
async def list_quizzes(video_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(QuizQuestion).where(QuizQuestion.video_id == video_id).order_by(QuizQuestion.order_index))
    return [_quiz_dict(q) for q in res.scalars().all()]


@router.post("/videos/{video_id}/quizzes")
async def create_quiz(video_id: str, body: QuizBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not await db.get(Video, video_id):
        raise HTTPException(status_code=404, detail="Video not found")
    if not body.question.get("en"):
        raise HTTPException(status_code=400, detail="English question is required")
    order = await _next_order(db, QuizQuestion, QuizQuestion.video_id, video_id)
    q = QuizQuestion(video_id=video_id, question=body.question, options=body.options,
                     correct_index=body.correct_index, order_index=order)
    db.add(q)
    await db.commit()
    return _quiz_dict(q)


@router.put("/quizzes/{quiz_id}")
async def update_quiz(quiz_id: str, body: QuizBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    q = await db.get(QuizQuestion, quiz_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.question = body.question
    q.options = body.options
    q.correct_index = body.correct_index
    await db.commit()
    return _quiz_dict(q)


@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    q = await db.get(QuizQuestion, quiz_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
    await db.commit()
    return {"deleted": True, "id": quiz_id}


# ── Assignment bank (per lesson) ─────────────────────────────────────────────
class AssignmentBody(BaseModel):
    question: dict                 # {"en": "...", "hi": "...", ...}
    rubric: str


def _assign_dict(a: AssignmentPrompt) -> dict:
    return {"id": a.id, "question": a.question, "rubric": a.rubric, "orderIndex": a.order_index}


@router.get("/videos/{video_id}/assignments")
async def list_assignments(video_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AssignmentPrompt).where(AssignmentPrompt.video_id == video_id).order_by(AssignmentPrompt.order_index))
    return [_assign_dict(a) for a in res.scalars().all()]


@router.post("/videos/{video_id}/assignments")
async def create_assignment(video_id: str, body: AssignmentBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if not await db.get(Video, video_id):
        raise HTTPException(status_code=404, detail="Video not found")
    if not body.question.get("en"):
        raise HTTPException(status_code=400, detail="English question is required")
    order = await _next_order(db, AssignmentPrompt, AssignmentPrompt.video_id, video_id)
    a = AssignmentPrompt(video_id=video_id, question=body.question, rubric=body.rubric, order_index=order)
    db.add(a)
    await db.commit()
    return _assign_dict(a)


@router.put("/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, body: AssignmentBody, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    a = await db.get(AssignmentPrompt, assignment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    a.question = body.question
    a.rubric = body.rubric
    await db.commit()
    return _assign_dict(a)


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str, _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    a = await db.get(AssignmentPrompt, assignment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(a)
    await db.commit()
    return {"deleted": True, "id": assignment_id}


@router.post("/sync-videos")
async def sync_videos(_: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Import known Cloudinary IDs (used by the learner site / WhatsApp) into the
    DB as per-language variants, matched by lesson title. Idempotent."""
    res = await db.execute(select(Video).options(selectinload(Video.language_variants)))
    videos = res.scalars().all()
    synced = []
    for v in videos:
        mapping = KNOWN_VIDEO_IDS.get(v.title)
        if not mapping:
            continue
        existing = {lv.language: lv for lv in v.language_variants}
        for lang, pid in mapping.items():
            if lang in existing:
                existing[lang].cloudinary_public_id = pid
            else:
                db.add(VideoLanguageVariant(video_id=v.id, language=lang, cloudinary_public_id=pid))
        if not v.cloudinary_public_id and mapping.get("en"):
            v.cloudinary_public_id = mapping["en"]
        synced.append({"title": v.title, "languages": sorted(mapping.keys())})
    await db.commit()
    return {"synced": synced, "count": len(synced)}


async def _tree(course_id: str, db: AsyncSession) -> dict:
    return _course_tree(await _load_course(course_id, db))
