"""
Examiner Agent: Tests learner understanding. Writes scores to DB.
MCQ: graded deterministically in code.
Open-ended: graded by Claude with a structured rubric.
"""
import json
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState, MODULE_MAP, language_name
from db.models import ExamAttempt

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

GRADER_SYSTEM = """You are grading an open-ended exam answer for an AI literacy course.

Rubric: {rubric}

Evaluate the learner's answer strictly against the rubric.
Return JSON only:
{{
  "score": <0.0 to 1.0>,
  "feedback": "<2-3 sentences explaining the score in the learner's language>",
  "passed": <true if score >= 0.7>
}}
"""

EXAMINER_SYSTEM = """You are the Examiner agent in an AI literacy certification platform.

You present exam questions from the current module and evaluate answers.
- For multiple choice questions: present the question with options A, B, C, D
- For open-ended questions: present the question and wait for the learner's answer
- After evaluating, provide brief, constructive feedback
- Be direct. No filler.
- ALWAYS respond in {target_language}, regardless of the language the learner writes in.

Current module: {module_title}
"""


async def present_next_question(state: LearnerState, question: dict) -> str:
    module = MODULE_MAP.get(state.current_module_id)
    if not module:
        return "No active module."

    system = EXAMINER_SYSTEM.format(
        module_title=module["title"],
        target_language=language_name(state.language),
    )

    if question["type"] == "mcq":
        options_str = "\n".join(
            f"{chr(65 + i)}) {opt}"
            for i, opt in enumerate(question["options"])
        )
        prompt = f"Present this exam question naturally:\n\nQuestion: {question['q']}\n\nOptions:\n{options_str}\n\nInstruction: Just present the question with options. Do not give hints or answers."
    else:
        prompt = f"Present this open-ended exam question naturally:\n\nQuestion: {question['q']}\n\nInstruction: Just present the question. Do not hint at the answer."

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


async def grade_mcq(question: dict, answer: str) -> dict:
    """Deterministic grading for multiple choice questions."""
    correct = question["answer"].upper().strip()
    submitted = answer.upper().strip()

    # Accept "A", "a", "(A)", "A)" etc.
    submitted_letter = ""
    for char in submitted:
        if char.upper() in "ABCD":
            submitted_letter = char.upper()
            break

    passed = submitted_letter == correct
    score = 1.0 if passed else 0.0
    return {"score": score, "passed": passed, "feedback": ""}


async def grade_open_ended(question: dict, answer: str, language: str) -> dict:
    """Claude grades open-ended answers against rubric."""
    system = GRADER_SYSTEM.format(rubric=question["rubric"])
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system=system,
        messages=[
            {"role": "user", "content": f"Learner's answer: {answer}\n\nWrite the feedback entirely in {language_name(language)}."}
        ],
    )
    text = response.content[0].text.strip()
    try:
        data = json.loads(text)
        return {
            "score": float(data.get("score", 0)),
            "passed": bool(data.get("passed", False)),
            "feedback": str(data.get("feedback", "")),
        }
    except (json.JSONDecodeError, ValueError):
        return {"score": 0.0, "passed": False, "feedback": "Could not grade response."}


async def run_examiner(
    state: LearnerState,
    user_message: str,
    db: AsyncSession,
) -> tuple[str, dict]:
    """
    Returns (response_text, updated_exam_state).
    exam_state: None if exam complete, dict with current question index if ongoing.
    """
    module = MODULE_MAP.get(state.current_module_id)
    if not module:
        return ("No active module.", state.exam_in_progress or {})

    questions = module["exam_questions"]
    exam_state = state.exam_in_progress or {"question_idx": 0, "scores": [], "feedbacks": []}
    idx = exam_state.get("question_idx", 0)

    if idx >= len(questions):
        # Exam complete — compute aggregate score
        scores = exam_state.get("scores", [])
        avg_score = sum(scores) / len(scores) if scores else 0.0
        passed = avg_score >= settings.pass_threshold

        # Persist to DB
        prev_attempts = await db.execute(
            select(func.count()).where(
                ExamAttempt.learner_id == state.learner_id,
                ExamAttempt.module_id == state.current_module_id,
            )
        )
        attempt_num = (prev_attempts.scalar() or 0) + 1

        attempt = ExamAttempt(
            id=str(uuid.uuid4()),
            learner_id=state.learner_id,
            module_id=state.current_module_id,
            attempt_number=attempt_num,
            score=avg_score,
            passed=passed,
            attempted_at=datetime.utcnow(),
        )
        db.add(attempt)
        await db.commit()

        result_msg = (
            f"Exam complete. Your score: {avg_score * 100:.0f}%. "
            + ("Module passed. Well done." if passed else f"Score below {settings.pass_threshold * 100:.0f}%. You can retry this module.")
        )
        return (result_msg, None)  # type: ignore

    current_q = questions[idx]

    # If no answer yet for this question, present it
    if exam_state.get("awaiting_answer"):
        # Grade the answer
        if current_q["type"] == "mcq":
            result = await grade_mcq(current_q, user_message)
        else:
            result = await grade_open_ended(current_q, user_message, state.language)

        scores = exam_state.get("scores", [])
        scores.append(result["score"])
        feedbacks = exam_state.get("feedbacks", [])
        feedbacks.append(result["feedback"])

        next_idx = idx + 1
        new_exam_state = {
            "question_idx": next_idx,
            "scores": scores,
            "feedbacks": feedbacks,
            "awaiting_answer": False,
        }

        feedback_text = result["feedback"] or ("Correct." if result["passed"] else "Not quite.")

        if next_idx < len(questions):
            # Present next question
            next_text = await present_next_question(state, questions[next_idx])
            new_exam_state["awaiting_answer"] = True
            return (f"{feedback_text}\n\n{next_text}", new_exam_state)
        else:
            # Trigger completion on next call
            new_exam_state["question_idx"] = next_idx
            return (feedback_text, new_exam_state)
    else:
        # Present first question
        text = await present_next_question(state, current_q)
        exam_state["awaiting_answer"] = True
        return (text, exam_state)
