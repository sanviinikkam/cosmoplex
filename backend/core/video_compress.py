"""Compress admin-uploaded videos to a WhatsApp-friendly (<16 MB) MP4 with ffmpeg,
so lesson videos can be delivered WITHOUT a credit-metered Cloudinary transform.

Runs on the backend (ffmpeg is installed in the Docker image). Called from the
async upload pipeline — never inline in a request — because transcoding a
multi-minute video shares the single worker's CPU for a few minutes.
"""
import asyncio
import os
import tempfile

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
