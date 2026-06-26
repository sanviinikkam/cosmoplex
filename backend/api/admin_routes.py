"""
Admin endpoints for managing video language variants.

These are internal-only endpoints for Cosmoplexx admins to map Cloudinary
uploads to course lessons + languages.

Usage:
  GET  /admin/videos?search=10+words       — find the video ID
  PUT  /admin/videos/{video_id}/variant    — set a language variant
  DEL  /admin/videos/{video_id}/variant/{lang} — remove a variant
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional

from db.database import get_db
from db.models import CourseModule, Section, Video, VideoLanguageVariant

router = APIRouter(prefix="/admin", tags=["admin"])

SUPPORTED_LANGUAGES = {"en", "hi", "mr"}


class VariantUpsert(BaseModel):
    language: str                        # "en" | "hi" | "mr"
    cloudinary_public_id: str            # e.g. "cosmoplexx/hi/10words_hindi"
    duration_seconds: Optional[int] = None


@router.get("/videos")
async def list_videos(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all videos with their current language variants.
    Pass ?search=<title> to filter."""
    result = await db.execute(
        select(Video)
        .options(
            selectinload(Video.language_variants),
            selectinload(Video.section)
            .selectinload(Section.module),
        )
        .order_by(Video.title)
    )
    videos = result.scalars().all()

    if search:
        q = search.lower()
        videos = [v for v in videos if q in v.title.lower()]

    return [
        {
            "id": v.id,
            "title": v.title,
            "section": v.section.title if v.section else None,
            "module": v.section.module.title if v.section and v.section.module else None,
            "baseCloudinaryId": v.cloudinary_public_id,
            "variants": [
                {
                    "language": lv.language,
                    "cloudinaryPublicId": lv.cloudinary_public_id,
                    "durationSeconds": lv.duration_seconds,
                }
                for lv in sorted(v.language_variants, key=lambda x: x.language)
            ],
        }
        for v in videos
    ]


@router.put("/videos/{video_id}/variant")
async def upsert_video_variant(
    video_id: str,
    body: VariantUpsert,
    db: AsyncSession = Depends(get_db),
):
    """Map a Cloudinary public ID to a specific lesson + language.
    Creates or updates."""
    if body.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{body.language}'. Supported: {sorted(SUPPORTED_LANGUAGES)}",
        )

    video_result = await db.execute(select(Video).where(Video.id == video_id))
    video = video_result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video {video_id} not found")

    variant_result = await db.execute(
        select(VideoLanguageVariant).where(
            VideoLanguageVariant.video_id == video_id,
            VideoLanguageVariant.language == body.language,
        )
    )
    variant = variant_result.scalar_one_or_none()

    action = "updated" if variant else "created"
    if variant:
        variant.cloudinary_public_id = body.cloudinary_public_id
        if body.duration_seconds is not None:
            variant.duration_seconds = body.duration_seconds
    else:
        variant = VideoLanguageVariant(
            video_id=video_id,
            language=body.language,
            cloudinary_public_id=body.cloudinary_public_id,
            duration_seconds=body.duration_seconds,
        )
        db.add(variant)

    await db.commit()
    return {
        "action": action,
        "videoId": video_id,
        "videoTitle": video.title,
        "language": body.language,
        "cloudinaryPublicId": body.cloudinary_public_id,
        "durationSeconds": body.duration_seconds,
    }


@router.delete("/videos/{video_id}/variant/{language}")
async def delete_video_variant(
    video_id: str,
    language: str,
    db: AsyncSession = Depends(get_db),
):
    """Remove a language variant."""
    result = await db.execute(
        select(VideoLanguageVariant).where(
            VideoLanguageVariant.video_id == video_id,
            VideoLanguageVariant.language == language,
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    await db.delete(variant)
    await db.commit()
    return {"deleted": True, "videoId": video_id, "language": language}
