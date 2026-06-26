"""
WebSocket handler: connects the web client to the agent orchestration system.
Each connection is a learner session. Messages route through the orchestrator
to one of the 5 specialist agents.
"""
import json
import uuid
from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import async_session_factory
from db.models import LearnerProfile, AgentEvent
from agents.base import LearnerState
from agents.orchestrator import route_message
from agents.teacher import run_teacher
from agents.examiner import run_examiner
from agents.illustrator import run_illustrator
from agents.task_assigner import run_task_assigner
from agents.certifier import run_certifier
from core.config import settings


async def _get_learner_from_token(token: str, db: AsyncSession):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        learner_id = payload.get("sub")
        if not learner_id:
            return None
        result = await db.execute(
            select(LearnerProfile).where(LearnerProfile.id == learner_id)
        )
        return result.scalar_one_or_none()
    except JWTError:
        return None


async def _log_event(
    learner_id: str, agent_name: str, event_type: str, payload: dict, db: AsyncSession
):
    event = AgentEvent(
        id=str(uuid.uuid4()),
        learner_id=learner_id,
        agent_name=agent_name,
        event_type=event_type,
        payload=payload,
    )
    db.add(event)
    await db.commit()


async def handle_learn_websocket(websocket: WebSocket, learner_id: str):
    await websocket.accept()

    async with async_session_factory() as db:
        # Verify learner exists
        result = await db.execute(
            select(LearnerProfile).where(LearnerProfile.id == learner_id)
        )
        learner = result.scalar_one_or_none()
        if not learner:
            await websocket.close(code=4001, reason="Learner not found")
            return

        state = LearnerState(
            learner_id=learner.id,
            name=learner.name,
            language=learner.preferred_language,
            current_module_id=learner.current_module_id or "m1",
            messages=[],
            last_agent="teacher",
        )

        # Send welcome message in the learner's chosen language
        _welcome_templates = {
            "en": "Welcome back, {name}. Continuing with your current module.",
            "hi": "वापसी पर स्वागत है, {name}। आपके मौजूदा मॉड्यूल के साथ आगे बढ़ते हैं।",
            "mr": "पुन्हा स्वागत आहे, {name}. तुमच्या सध्याच्या मॉड्यूलसह पुढे चालू ठेवूया.",
            "te": "మళ్ళీ స్వాగతం, {name}. మీ ప్రస్తుత మాడ్యూల్‌తో కొనసాగిద్దాం.",
            "ta": "மீண்டும் வரவேற்கிறோம், {name}. உங்கள் தற்போதைய தொகுதியுடன் தொடர்வோம்.",
            "kn": "ಮತ್ತೆ ಸ್ವಾಗತ, {name}. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮಾಡ್ಯೂಲ್‌ನೊಂದಿಗೆ ಮುಂದುವರಿಯೋಣ.",
        }
        _welcome = _welcome_templates.get(
            learner.preferred_language or "en", _welcome_templates["en"]
        ).format(name=learner.name)
        await websocket.send_json({
            "id": str(uuid.uuid4()),
            "agent": "teacher",
            "content": _welcome,
        })

        try:
            while True:
                raw = await websocket.receive_text()
                data = json.loads(raw)
                user_content: str = data.get("content", "").strip()
                if not user_content:
                    continue

                # Add user message to state
                state.messages.append({"role": "user", "content": user_content})

                # Route to correct agent
                agent_name = await route_message(state, user_content)
                state.last_agent = agent_name

                image_url = None
                response_text = ""

                if agent_name == "teacher":
                    response_text = await run_teacher(state, user_content)

                elif agent_name == "examiner":
                    response_text, new_exam_state = await run_examiner(
                        state, user_content, db
                    )
                    state.exam_in_progress = new_exam_state

                elif agent_name == "illustrator":
                    response_text, image_url = await run_illustrator(state, user_content)

                elif agent_name == "task_assigner":
                    response_text = await run_task_assigner(state, user_content, db)

                elif agent_name == "certifier":
                    response_text, cert_url = await run_certifier(state, db)
                    if cert_url:
                        image_url = cert_url  # reuse field for cert URL

                else:
                    response_text = await run_teacher(state, user_content)

                # Add assistant message to state
                state.messages.append({"role": "assistant", "content": response_text})

                # Trim message history to last 20 to control token costs
                if len(state.messages) > 40:
                    state.messages = state.messages[-40:]

                # Log to DB
                await _log_event(
                    learner.id,
                    agent_name,
                    "message",
                    {"user": user_content, "response": response_text[:500]},
                    db,
                )

                await websocket.send_json({
                    "id": str(uuid.uuid4()),
                    "agent": agent_name,
                    "content": response_text,
                    **({"imageUrl": image_url} if image_url else {}),
                })

        except WebSocketDisconnect:
            pass
        except Exception as e:
            try:
                await websocket.send_json({
                    "id": str(uuid.uuid4()),
                    "agent": "orchestrator",
                    "content": "Something went wrong on the server. Please try again.",
                })
            except Exception:
                pass
