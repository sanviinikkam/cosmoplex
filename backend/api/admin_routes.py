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
import io
import json
import time
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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


# ── Bulk import: upload a doc of questions → Claude extracts + translates ───────
# Lets an admin drop a .docx/.txt (or paste text) instead of hand-entering each
# question in 6 languages. Claude pulls out the questions and translates every
# one into all 6 languages, then they're appended to the lesson's bank.
BULK_MODEL = "claude-sonnet-4-6"   # quality matters across languages; admin-only, infrequent
BULK_LANGS = ["en", "hi", "mr", "te", "ta", "kn"]

QUIZ_SYS = """You extract multiple-choice quiz questions from a document and translate them.
The text may be messy (copied from Word, tables, numbered lists). Find EVERY multiple-choice question.
For each: the question text, its 2-4 answer options, and which option is correct.
Translate the question and EVERY option into: English(en), Hindi(hi), Marathi(mr), Telugu(te), Tamil(ta), Kannada(kn). Keep translations faithful and natural for Indian learners; keep technical AI terms recognizable.
Return ONLY strict JSON (no markdown, no commentary) shaped exactly:
{"questions":[{"question":{"en":"","hi":"","mr":"","te":"","ta":"","kn":""},"options":{"en":["",""],"hi":["",""],"mr":["",""],"te":["",""],"ta":["",""],"kn":["",""]},"correct_index":0}]}
Rules:
- correct_index is 0-based into the options arrays.
- Every language's options array MUST have the same number of items, in the same order, as English.
- Detect the correct answer from any marker in the source (*, "Answer:", bold, checkmark). If none, choose the best answer.
- Do not invent extra questions. Output only the JSON object."""

ASSIGN_SYS = """You extract open-ended assignment questions from a document and translate them.
Find EVERY assignment/task prompt (written answers, NOT multiple choice).
Translate each question into: English(en), Hindi(hi), Marathi(mr), Telugu(te), Tamil(ta), Kannada(kn). Faithful and natural.
For each assignment also produce a short grading "rubric" in ENGLISH (language-neutral) for an AI grader — use the document's grading criteria if given, otherwise write a concise 1-2 sentence rubric from the question.
Return ONLY strict JSON (no markdown, no commentary) shaped exactly:
{"assignments":[{"question":{"en":"","hi":"","mr":"","te":"","ta":"","kn":""},"rubric":""}]}
Output only the JSON object."""


def _extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".docx"):
        try:
            import docx
        except ImportError:
            raise HTTPException(status_code=500,
                detail="Server can't read .docx (python-docx missing). Paste the text or upload a .txt.")
        try:
            doc = docx.Document(io.BytesIO(data))
            parts = [p.text for p in doc.paragraphs]
            for tbl in doc.tables:
                for row in tbl.rows:
                    parts.append("\t".join(c.text for c in row.cells))
            return "\n".join(parts).strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Couldn't read that .docx: {e}")
    if name.endswith(".doc"):
        raise HTTPException(status_code=400,
            detail="Old .doc isn't supported — save as .docx or .txt, or paste the text.")
    return data.decode("utf-8", errors="ignore").strip()  # txt / csv / md / other


async def _claude_json(system: str, user: str, max_tokens: int = 8000) -> dict:
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured on the server.")
    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        resp = await client.messages.create(
            model=BULK_MODEL, max_tokens=max_tokens,
            system=system, messages=[{"role": "user", "content": user}],
        )
        raw = (resp.content[0].text or "").strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI extraction failed: {e}")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        i, j = raw.find("{"), raw.rfind("}")   # tolerate stray prose / code fences
        if i != -1 and j > i:
            try:
                return json.loads(raw[i:j + 1])
            except json.JSONDecodeError:
                pass
        raise HTTPException(status_code=422,
            detail="Couldn't parse questions from that document — it may be too long or unclear. "
                   "Try fewer questions or a cleaner layout.")


def _clean_quiz(items) -> list[dict]:
    out: list[dict] = []
    for it in (items or []):
        q, opts = (it.get("question") or {}), (it.get("options") or {})
        if not isinstance(q, dict) or not isinstance(opts, dict):
            continue
        en_q = (q.get("en") or "").strip()
        en_opts = opts.get("en")
        if not en_q or not isinstance(en_opts, list) or len(en_opts) < 2:
            continue
        n = len(en_opts)
        try:
            ci = max(0, min(int(it.get("correct_index", 0)), n - 1))
        except (TypeError, ValueError):
            ci = 0
        clean_q = {"en": en_q}
        clean_opts = {"en": [str(o).strip() for o in en_opts]}
        for lang in BULK_LANGS[1:]:
            lv_q, lv_o = (q.get(lang) or "").strip(), opts.get(lang)
            if lv_q and isinstance(lv_o, list) and len(lv_o) == n and all(str(x).strip() for x in lv_o):
                clean_q[lang] = lv_q
                clean_opts[lang] = [str(o).strip() for o in lv_o]
        out.append({"question": clean_q, "options": clean_opts, "correct_index": ci})
    return out


def _clean_assignments(items) -> list[dict]:
    out: list[dict] = []
    for it in (items or []):
        q = it.get("question") or {}
        if not isinstance(q, dict):
            continue
        en_q = (q.get("en") or "").strip()
        if not en_q:
            continue
        rubric = (it.get("rubric") or "").strip() or (
            "Evaluate whether the answer correctly and clearly addresses the question and "
            "shows understanding of the concept.")
        clean_q = {"en": en_q}
        for lang in BULK_LANGS[1:]:
            lv = (q.get(lang) or "").strip()
            if lv:
                clean_q[lang] = lv
        out.append({"question": clean_q, "rubric": rubric})
    return out


async def _bulk_content(file: UploadFile | None, text: str | None) -> str:
    if file is not None:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        content = _extract_text(file.filename or "", data)
    else:
        content = (text or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="No content — upload a .docx/.txt or paste the questions.")
    return content[:60000]   # guard against a huge doc blowing the token budget


@router.post("/videos/{video_id}/quizzes/bulk")
async def bulk_quizzes(video_id: str, file: UploadFile | None = File(None), text: str | None = Form(None),
                       _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Upload a doc / paste text of MCQs → extract + translate → append to the bank."""
    if not await db.get(Video, video_id):
        raise HTTPException(status_code=404, detail="Video not found")
    content = await _bulk_content(file, text)
    parsed = await _claude_json(QUIZ_SYS, content)
    items = _clean_quiz(parsed.get("questions"))
    if not items:
        raise HTTPException(status_code=422, detail="No multiple-choice questions found in that document.")
    order = await _next_order(db, QuizQuestion, QuizQuestion.video_id, video_id)
    created = [QuizQuestion(video_id=video_id, question=it["question"], options=it["options"],
                            correct_index=it["correct_index"], order_index=order + i)
               for i, it in enumerate(items)]
    for q in created:
        db.add(q)
    await db.commit()
    return {"added": len(created), "items": [_quiz_dict(q) for q in created]}


@router.post("/videos/{video_id}/assignments/bulk")
async def bulk_assignments(video_id: str, file: UploadFile | None = File(None), text: str | None = Form(None),
                           _: bool = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Upload a doc / paste text of assignment prompts → extract + translate → append."""
    if not await db.get(Video, video_id):
        raise HTTPException(status_code=404, detail="Video not found")
    content = await _bulk_content(file, text)
    parsed = await _claude_json(ASSIGN_SYS, content)
    items = _clean_assignments(parsed.get("assignments"))
    if not items:
        raise HTTPException(status_code=422, detail="No assignment questions found in that document.")
    order = await _next_order(db, AssignmentPrompt, AssignmentPrompt.video_id, video_id)
    created = [AssignmentPrompt(video_id=video_id, question=it["question"], rubric=it["rubric"],
                               order_index=order + i)
               for i, it in enumerate(items)]
    for a in created:
        db.add(a)
    await db.commit()
    return {"added": len(created), "items": [_assign_dict(a) for a in created]}


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

    # Import the existing quiz + assignment banks (deduped by English text).
    quizzes_added = assignments_added = 0
    legacy_path = Path(__file__).with_name("legacy_content.json")
    if legacy_path.exists():
        legacy = json.loads(legacy_path.read_text(encoding="utf-8"))
        by_title = {v.title: v for v in videos}

        for title, quizzes in legacy.get("quizzesByLesson", {}).items():
            v = by_title.get(title)
            if not v:
                continue
            ex = await db.execute(select(QuizQuestion).where(QuizQuestion.video_id == v.id))
            existing_q = {q.question.get("en") for q in ex.scalars().all()}
            base = await _next_order(db, QuizQuestion, QuizQuestion.video_id, v.id)
            for item in quizzes:
                if item["question"].get("en") in existing_q:
                    continue
                db.add(QuizQuestion(video_id=v.id, question=item["question"], options=item["options"],
                                    correct_index=item["correct_index"], order_index=base))
                base += 1
                quizzes_added += 1

        for title, prompts in legacy.get("assignmentsByLesson", {}).items():
            v = by_title.get(title)
            if not v:
                continue
            ex = await db.execute(select(AssignmentPrompt).where(AssignmentPrompt.video_id == v.id))
            existing_a = {a.question.get("en") for a in ex.scalars().all()}
            base = await _next_order(db, AssignmentPrompt, AssignmentPrompt.video_id, v.id)
            for item in prompts:
                if item["question"].get("en") in existing_a:
                    continue
                db.add(AssignmentPrompt(video_id=v.id, question=item["question"],
                                        rubric=item["rubric"], order_index=base))
                base += 1
                assignments_added += 1

    await db.commit()
    return {"videosSynced": len(synced), "quizzesAdded": quizzes_added,
            "assignmentsAdded": assignments_added}


async def _tree(course_id: str, db: AsyncSession) -> dict:
    return _course_tree(await _load_course(course_id, db))
