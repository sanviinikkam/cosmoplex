"""Compress admin-uploaded videos to a WhatsApp-friendly (<16 MB) MP4 with ffmpeg,
so lesson videos can be delivered WITHOUT a credit-metered Cloudinary transform.

Runs on the backend (ffmpeg is installed in the Docker image). Called from the
async upload pipeline — never inline in a request — because transcoding a
multi-minute video shares the single worker's CPU for a few minutes.
"""
import asyncio
import hashlib
import os
import tempfile
import time

import httpx

from core.config import settings

# 480p / ~400 kbps H.264 + AAC + faststart. Matches the intent of the old
# `w_480,br_400k,vc_h264,ac_aac` Cloudinary transform: ~10 MB for a few-minute
# lesson, well under WhatsApp's 16 MB cap, and `+faststart` puts the moov atom at
# the front so it plays INLINE in WhatsApp (the old transform lacked this).
_FFMPEG_ARGS = [
    "-vf", "scale='min(480,iw)':-2",          # cap width 480, keep aspect, even height
    "-c:v", "libx264", "-preset", "veryfast",
    "-b:v", "400k", "-maxrate", "600k", "-bufsize", "1200k",
    "-c:a", "aac", "-b:a", "64k",
    "-movflags", "+faststart",
    "-y",
]


async def compress_to_whatsapp_mp4(input_path: str, output_path: str) -> bool:
    """Transcode input_path → output_path (a <16 MB, inline-playable MP4).

    Returns True on success. Operates on files (not in-memory bytes) so a large
    source doesn't blow the instance's RAM. Never raises — logs and returns False
    so the caller can leave the video uncompressed rather than crash the upload.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-i", input_path, *_FFMPEG_ARGS, output_path,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, err = await proc.communicate()
    except FileNotFoundError:
        print("⚠ ffmpeg not found on PATH — is it installed in the image?")
        return False
    except Exception as e:  # pragma: no cover - defensive
        print(f"⚠ ffmpeg compress errored: {e}")
        return False
    if proc.returncode != 0 or not os.path.exists(output_path):
        tail = (err or b"").decode("utf-8", "replace")[-600:]
        print(f"⚠ ffmpeg compress failed (rc={proc.returncode}): {tail}")
        return False
    return True


def make_tempfile(suffix: str = "") -> str:
    """Create a temp file path (caller is responsible for deleting it)."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    return path


async def cloudinary_download(public_id: str, dest_path: str) -> bool:
    """Download the raw (untransformed) Cloudinary video to dest_path, streaming to
    disk so a large source doesn't blow RAM. Returns True on success."""
    url = (f"https://res.cloudinary.com/{settings.cloudinary_cloud_name}"
           f"/video/upload/{public_id}.mp4")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=300) as h:
            async with h.stream("GET", url) as r:
                if r.status_code >= 400:
                    print(f"⚠ cloudinary download {r.status_code} for {public_id}")
                    return False
                with open(dest_path, "wb") as f:
                    async for chunk in r.aiter_bytes(1 << 20):
                        f.write(chunk)
        return True
    except Exception as e:
        print(f"⚠ cloudinary download error for {public_id}: {e}")
        return False


async def cloudinary_upload(src_path: str, public_id: str | None = None,
                            folder: str = "cosmoplex/lessons") -> tuple[str, int | None] | None:
    """Signed upload of a local video file to Cloudinary (same signing scheme as the
    admin signature endpoint). If `public_id` is given (a full foldered path like
    'cosmoplex/lessons/1.1/1.1-en'), the asset is named that and overwrites any
    prior one with that name; otherwise Cloudinary auto-names it under `folder`.
    Returns (public_id, duration_seconds) or None."""
    if not settings.cloudinary_api_key or not settings.cloudinary_api_secret:
        print("⚠ cloudinary api key/secret not configured — cannot upload compressed video")
        return None
    ts = int(time.time())
    params: dict[str, str] = {"timestamp": str(ts)}
    if public_id:
        params["public_id"] = public_id
        params["overwrite"] = "true"
    else:
        params["folder"] = folder
    # Cloudinary signature: all signed params, alphabetical, joined by &, + secret.
    to_sign = "&".join(f"{k}={params[k]}" for k in sorted(params)) + settings.cloudinary_api_secret
    signature = hashlib.sha1(to_sign.encode()).hexdigest()
    url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/video/upload"
    try:
        async with httpx.AsyncClient(timeout=300) as h:
            with open(src_path, "rb") as f:
                r = await h.post(url, data={
                    **params,
                    "api_key": settings.cloudinary_api_key,
                    "signature": signature,
                }, files={"file": ("video.mp4", f, "video/mp4")})
        if r.status_code >= 400:
            print(f"⚠ cloudinary upload failed {r.status_code}: {r.text[:300]}")
            return None
        data = r.json()
        pid = data.get("public_id")
        dur = data.get("duration")
        return (pid, int(dur) if dur else None) if pid else None
    except Exception as e:
        print(f"⚠ cloudinary upload error: {e}")
        return None
