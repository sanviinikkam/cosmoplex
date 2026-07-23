"""
Teacher Agent: Delivers AI literacy lesson content in the learner's language.
System prompt is always in English; output is always in the target language.
"""
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState, MODULE_MAP, language_name

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

TEACHER_SYSTEM = """You are the Teacher agent in an AI literacy certification platform.

Your responsibilities:
- Deliver lesson content from the current module in a clear, engaging way
- Break concepts into short, digestible paragraphs suitable for a web interface
- Answer questions about AI concepts accurately
- When you finish delivering a module's content, explicitly tell the learner they can proceed to the exam by asking if they are ready to test their understanding
- ALWAYS respond in {target_language}. Even if the learner writes to you in English or any other language, your entire reply must be written in {target_language}.
- You may reason internally in English, but the visible reply is always in {target_language}.

CURRENT MODULE CONTENT:
{module_content}

Style guidelines:
- Use concrete examples over abstract explanations
- Keep each response under 300 words unless a concept genuinely requires more
- No filler phrases ("Great question!", "Certainly!"). Get to the point.
- No markdown headers in responses — use natural prose
- If asked about something outside this module, address it briefly and redirect to the module
"""


async def run_teacher(state: LearnerState, user_message: str) -> str:
    module = MODULE_MAP.get(state.current_module_id)
    if not module:
        return "Your course is complete. Navigate to the certificate page to download your certificate."

    system_text = TEACHER_SYSTEM.format(
        module_content=module["content"],
        target_language=language_name(state.language),
    )

    # WhatsApp chats should be short — cuts the (priciest) output tokens and
    # reads better on a phone. Web chat keeps the normal length.
    is_whatsapp = str(state.learner_id).startswith("wa:")
    if is_whatsapp:
        system_text += (
            "\n\nThis is a WhatsApp chat. Keep replies short: under 120 words, "
            "1-2 short paragraphs, no bullet lists or headers. Warm but concise."
        )

    # Build message history (last few turns to control token cost)
    history = state.messages[-10:] if is_whatsapp else state.messages[-20:]
    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": user_message})

    response = await client.messages.create(
        model="claude-haiku-4-5",  # tutor runs on Haiku — ~3x cheaper than Sonnet, fine for chat
        max_tokens=350 if is_whatsapp else 600,
        # Cache the (stable) system prompt + module content so repeat chats bill
        # the prefix at ~0.1x instead of full price.
        system=[{"type": "text", "text": system_text, "cache_control": {"type": "ephemeral"}}],
        messages=messages,
    )
    return response.content[0].text.strip()
