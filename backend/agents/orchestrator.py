"""
Orchestrator: Claude Haiku routes each message to the correct specialist agent.
Pattern: cheap model for routing, expensive model for content.
"""
import json
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

ROUTING_SYSTEM = """You are a routing orchestrator for an AI literacy learning platform.

Given the learner's message and their current learning state, decide which specialist agent should handle it.

Agents:
- teacher: Deliver lesson content, explain concepts, answer questions about AI
- examiner: Run an exam or evaluate an answer to an exam question
- illustrator: Generate a visual diagram or illustration of a concept
- task_assigner: Assign or check on a practice task
- certifier: Issue a certificate (only when all modules are complete)

Return ONLY valid JSON in this format:
{
  "agent": "<agent_name>",
  "reason": "<one sentence>"
}

Rules:
- If the learner is in an active exam (exam_in_progress is not null), route to "examiner"
- If the learner asks for a picture, diagram, or visual, route to "illustrator"
- If the learner asks about tasks, assignments, or practice exercises, route to "task_assigner"
- If all modules complete and learner asks about certificate, route to "certifier"
- Default to "teacher" for all learning content questions
"""


async def route_message(state: LearnerState, user_message: str) -> str:
    """Returns the agent name that should handle this message."""
    context = {
        "current_module": state.current_module_id,
        "exam_in_progress": state.exam_in_progress is not None,
        "task_in_progress": state.task_in_progress is not None,
        "last_agent": state.last_agent,
        "message_count": len(state.messages),
    }

    response = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=128,
        system=ROUTING_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": f"Context: {json.dumps(context)}\n\nLearner message: {user_message}",
            }
        ],
    )

    text = response.content[0].text.strip()
    try:
        data = json.loads(text)
        return data.get("agent", "teacher")
    except (json.JSONDecodeError, KeyError):
        return "teacher"
