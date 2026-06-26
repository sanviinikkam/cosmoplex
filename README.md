# Cosmoplexx

AI Literacy Certification Platform — 5-agent multi-language learning system built on Claude.

## Architecture

```
frontend/   Next.js 16 + Tailwind v4 + Framer Motion
backend/    FastAPI + PostgreSQL + Redis + Claude agents
```

## Quick Start

### 1. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

You also need PostgreSQL and Redis running locally:
- PostgreSQL: `localhost:5432`, database `cosmoplexx`
- Redis: `localhost:6379`

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (defaults to localhost) |
| `SECRET_KEY` | Yes | JWT signing secret |
| `GROQ_API_KEY` | No | Voice transcription (optional) |
| `FAL_API_KEY` | No | Image generation for Illustrator agent (optional) |

## Agent architecture

| Agent | Model | Responsibility |
|---|---|---|
| Orchestrator | Claude Haiku 4.5 | Routes messages to the right specialist |
| Teacher | Claude Sonnet 4.6 | Delivers lesson content in learner's language |
| Illustrator | Claude Sonnet 4.6 | Generates visual explanations (fal.ai) |
| Examiner | Claude Sonnet 4.6 | Tests understanding; writes scores to DB |
| Task Assigner | Claude Sonnet 4.6 | Assigns and tracks practice exercises |
| Certifier | Claude Sonnet 4.6 | Issues PDF certificate after code gate passes |

## Certificate gate

The Certifier agent only runs **after** deterministic Python code verifies (from the database) that:
- Every module exam is passed above the threshold (default 70%)
- Every module task is submitted

The LLM never decides if a learner passed. The database does.
