"""
Illustrator Agent: Generates visual explanations using fal.ai / Replicate.
Falls back to a description if image generation is unavailable.
"""
import httpx
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState, MODULE_MAP, language_name

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

CAPTION_SYSTEM = """You are the Illustrator agent in an AI literacy platform.
Generate a clear, educational image description for the concept requested.
Then write a concise caption explaining the visual in {target_language}.
The caption must be written entirely in {target_language}.
Keep caption under 80 words.
Return JSON: {{"prompt": "<image_generation_prompt>", "caption": "<educational_caption>"}}
"""

DESCRIPTION_SYSTEM = """You are the Illustrator agent in an AI literacy platform.
The image generation API is unavailable. Instead, describe what the visual would show
in vivid detail, as if guiding someone to draw it. Write the entire description in {target_language}.
Keep under 200 words. Be concrete and educational.
"""


async def _generate_image_fal(prompt: str) -> str | None:
    """Calls fal.ai for image generation. Returns URL or None."""
    if not settings.fal_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as h:
            resp = await h.post(
                "https://fal.run/fal-ai/fast-sdxl",
                headers={"Authorization": f"Key {settings.fal_api_key}"},
                json={"prompt": prompt, "image_size": "square_hd"},
            )
            if resp.status_code == 200:
                data = resp.json()
                images = data.get("images", [])
                if images:
                    return images[0].get("url")
    except httpx.HTTPError:
        pass
    return None


async def run_illustrator(state: LearnerState, user_message: str) -> tuple[str, str | None]:
    """Returns (caption_text, image_url_or_none)."""
    module = MODULE_MAP.get(state.current_module_id)
    module_context = f"Current module: {module['title']}" if module else ""

    # Generate prompt and caption
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=CAPTION_SYSTEM.format(target_language=language_name(state.language)),
        messages=[
            {
                "role": "user",
                "content": f"{module_context}\n\nLearner request: {user_message}",
            }
        ],
    )
    import json
    text = response.content[0].text.strip()
    try:
        data = json.loads(text)
        prompt = data.get("prompt", user_message)
        caption = data.get("caption", "")
    except json.JSONDecodeError:
        prompt = user_message
        caption = text

    image_url = await _generate_image_fal(prompt)

    if image_url:
        return (caption, image_url)

    # Fallback: describe the visual
    desc_response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=DESCRIPTION_SYSTEM.format(target_language=language_name(state.language)),
        messages=[
            {
                "role": "user",
                "content": f"Describe a visual for: {user_message}\n{module_context}",
            }
        ],
    )
    return (desc_response.content[0].text.strip(), None)
