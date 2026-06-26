"""
Task Assigner Agent: Assigns and tracks practice tasks after each module.
"""
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState, MODULE_MAP, language_name
from db.models import TaskAssignment

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

TASK_SYSTEM = """You are the Task Assigner agent in an AI literacy platform.
Your role:
- Assign practical tasks after module completion
- Check in on task progress when the learner reports back
- Accept task submissions and confirm they're logged
- Be encouraging but direct. No filler phrases.
- ALWAYS respond in {target_language}, regardless of the language the learner writes in.

When the learner submits their task response, acknowledge it clearly and confirm it has been recorded.
"""


async def assign_task(state: LearnerState, db: AsyncSession) -> str:
    """Assign the task for the current module."""
    module = MODULE_MAP.get(state.current_module_id)
    if not module:
        return "No task available for the current module."

    task_def = module.get("task")
    if not task_def:
        return "This module does not have a practice task."

    # Check if already assigned
    existing = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.learner_id == state.learner_id,
            TaskAssignment.module_id == state.current_module_id,
        )
    )
    if existing.scalar_one_or_none():
        return f"You already have an active task for this module: **{task_def['title']}**\n\n{task_def['description']}"

    # Create assignment
    assignment = TaskAssignment(
        id=str(uuid.uuid4()),
        learner_id=state.learner_id,
        task_id=f"task-{state.current_module_id}",
        module_id=state.current_module_id,
        title=task_def["title"],
        description=task_def["description"],
        assigned_at=datetime.utcnow(),
        status="assigned",
    )
    db.add(assignment)
    await db.commit()

    return f"Task assigned: **{task_def['title']}**\n\n{task_def['description']}\n\nWhen you're ready, reply with your response and I'll log it to your record."


async def accept_submission(
    state: LearnerState, user_message: str, db: AsyncSession
) -> str:
    """Accept and record a task submission."""
    result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.learner_id == state.learner_id,
            TaskAssignment.module_id == state.current_module_id,
            TaskAssignment.status.in_(["assigned", "in_progress"]),
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        return "No active task found for this module. Have you already submitted it?"

    assignment.submitted_at = datetime.utcnow()
    assignment.status = "submitted"
    await db.commit()

    # Generate acknowledgement
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        system=TASK_SYSTEM.format(target_language=language_name(state.language)),
        messages=[
            {
                "role": "user",
                "content": f"The learner just submitted their task for module '{state.current_module_id}'. Their submission: {user_message[:500]}\n\nAcknowledge the submission, confirm it's been recorded, and encourage them to proceed to the exam if they haven't already.",
            }
        ],
    )
    return response.content[0].text.strip()


async def run_task_assigner(
    state: LearnerState, user_message: str, db: AsyncSession
) -> str:
    msg_lower = user_message.lower()

    # Detect if this is a submission
    submission_keywords = ["here is", "here's", "my answer", "my response", "submitting", "done", "completed", "finished"]
    is_submission = any(kw in msg_lower for kw in submission_keywords) and len(user_message) > 50

    if is_submission:
        return await accept_submission(state, user_message, db)

    # Check if asking about current task
    if any(kw in msg_lower for kw in ["what", "task", "assignment", "practice"]):
        module = MODULE_MAP.get(state.current_module_id)
        if module and module.get("task"):
            return await assign_task(state, db)

    # Default: assign the task
    return await assign_task(state, db)
