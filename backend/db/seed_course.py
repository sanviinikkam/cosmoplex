"""
Seed the database with the AI101 course structure (from AI101_Course_Strctre.xlsx).

Run from the backend directory:
    python -m db.seed_course          # skips if already seeded
    python -m db.seed_course --force  # drops existing course and re-seeds
"""

import asyncio
import sys
from db.database import async_session_factory, create_tables
from db.models import Course, CourseModule, Section, Video, CourseEnrollment
from sqlalchemy import select, delete


# ── Course structure (S0–S8, 53 lessons) ─────────────────────────────────────
# Each lesson: (title, duration_mins)

# Level assignment
#   1 = Beginner      (order_index 0-2: S0, S1, S2)
#   2 = Intermediate  (order_index 3-4: S3, S4)
#   3 = Advanced      (order_index 5-8: S5, S6, S7, S8)

COURSE_MODULES = [
    {
        "title": "Understanding AI",
        "outcome": "Understand what AI is, where it already exists in your life, and why now is the right time to learn it.",
        "level": 1,
        "lessons": [
            ("Welcome - Why AI Matters for Your Career Right Now", 5),
            ("What AI Actually Is - No Jargon", 7),
            ("AI Is Already in Your Life", 6),
            ("Traditional AI vs Generative AI - What Changed", 7),
            ("What AI Can and Cannot Do", 7),
            ("Overcoming the Fear of Tech", 6),
        ],
    },
    {
        "title": "How AI Actually Works",
        "outcome": "Understand how LLMs work, what tokens and context windows are, and why AI sometimes confidently lies.",
        "level": 1,
        "lessons": [
            ("The 10 AI Words Every Fresher Must Know", 8),
            ("How an LLM Actually Works", 7),
            ("Tokens and Context Window - AI's Short-Term Memory", 6),
            ("When AI Confidently Lies - Hallucination", 7),
            ("The Co-Pilot Mindset - You Direct, AI Navigates", 6),
            ("AI in India - What's Happening Right Now", 7),
        ],
    },
    {
        "title": "Art of Prompting",
        "outcome": "Master the CRAFT prompting formula and the 4D framework so you get useful output every time.",
        "level": 1,
        "lessons": [
            ("What Is a Prompt?", 6),
            ("The CRAFT Prompting Formula — All 5 Elements", 15),
            ("The 4D Framework — Delegation, Discernment and Diligence", 8),
            ("Iterative Prompting - The 3-Turn Rule", 7),
        ],
    },
    {
        "title": "AI Landscape & Tools",
        "outcome": "Know the five major AI ecosystems and pick the right tool for any task at work.",
        "level": 2,
        "lessons": [
            ("The AI Landscape - Five Companies Every Professional Should Know", 7),
            ("The OpenAI Ecosystem - ChatGPT and What It Includes", 7),
            ("The Anthropic Ecosystem - Claude and Its Key Features", 7),
            ("Google's AI Ecosystem - Gemini and NotebookLM", 6),
            ("Microsoft Copilot - AI Built Into the Corporate Office", 7),
            ("Other Tools Every Professional Should Know", 6),
            ("Your AI Decision Map - Which Tool for Which Task", 7),
        ],
    },
    {
        "title": "AI at Work",
        "outcome": "Use AI to write, research, analyse data, and prepare for any meeting — faster and better.",
        "level": 2,
        "lessons": [
            ("Writing at Work with AI - Emails, Reports and Summaries", 7),
            ("Understanding Documents You Did Not Write", 6),
            ("Research at Work - Finding Answers You Can Trust", 7),
            ("Making Sense of Data Without Being a Data Person", 7),
            ("Preparing for Any Meeting in 10 Minutes", 6),
            ("Explaining Complex Things Simply", 6),
            ("When NOT to Use AI at Work - Professional Judgment", 7),
        ],
    },
    {
        "title": "Role-Specific Applications",
        "outcome": "Apply AI to your exact job function with role-specific prompts and workflows.",
        "level": 3,
        "lessons": [
            ("Sales - Research, Outreach and Objection Handling", 8),
            ("HR and Admin - JDs, Onboarding and Meeting Summaries", 8),
            ("Marketing - Campaign Ideas and Social Media Copy", 8),
            ("Customer Support - Empathetic and De-escalating Responses", 8),
            ("Data Analysis - Reading a Spreadsheet Without Formulas", 8),
            ("Translating Corporate English to Simple Hindi", 7),
            ("Product Management — AI for Roadmaps, User Stories and Stakeholder Updates", 8),
        ],
    },
    {
        "title": "AI Ethics & Safety",
        "outcome": "Spot hallucinations, protect your data, recognise bias, and apply the FAST ethics checklist.",
        "level": 3,
        "lessons": [
            ("Spotting AI Hallucinations in the Wild", 7),
            ("The Golden Rule - Verify Before You Submit", 6),
            ("Data Privacy 101 - What Never to Share with AI", 7),
            ("AI Bias - When the Output Is Unfair", 6),
            ("The FAST Ethics Framework - Your 30-Second Checklist", 7),
            ("Will AI Replace My Job? - An Honest Answer", 7),
            ("Fake but Real: AI Scams, Voice Clones and Deepfakes", 7),
            ("How AI Decides What You See — And Why It Matters", 7),
        ],
    },
    {
        "title": "Future & Career",
        "outcome": "Answer any AI question in any interview and build a personal plan for staying current.",
        "level": 3,
        "lessons": [
            ("What Companies Are Actually Doing With AI Right Now", 7),
            ("AI Trends Every Professional Should Know in 2026", 7),
            ("How to Stay Current Without Getting Overwhelmed", 6),
            ("Answering AI Questions in Interviews - No Blank Faces", 8),
            ("AI for Your First Job: Resume, Application and Interview Prep", 9),
            ("You Are AI-Ready - What Comes Next", 7),
        ],
    },
]

COURSE_TITLE = "AI101: AI Literacy Certification"
COURSE_DESCRIPTION = (
    "A complete AI literacy programme for freshers and early-career professionals. "
    "Learn what AI is, how it works, and how to use it at work — through 53 short "
    "video lessons, hands-on prompting tasks, and a conversational AI tutor. "
    "No coding required."
)


async def seed(force: bool = False):
    await create_tables()
    async with async_session_factory() as db:

        # Check if already seeded
        result = await db.execute(select(Course).limit(1))
        existing = result.scalar_one_or_none()

        if existing and not force:
            print(f"Course already seeded (id={existing.id}) — skipping.")
            print("Run with --force to drop and re-seed.")
            return

        if existing and force:
            print(f"--force: dropping existing course data…")
            # Delete in FK order
            course_ids_result = await db.execute(select(Course.id))
            course_ids = [r[0] for r in course_ids_result.all()]
            await db.execute(delete(CourseEnrollment))
            # Cascade via relationships: delete videos → sections → modules → course
            for cid in course_ids:
                mods_result = await db.execute(
                    select(CourseModule).where(CourseModule.course_id == cid)
                )
                for mod in mods_result.scalars().all():
                    secs_result = await db.execute(
                        select(Section).where(Section.module_id == mod.id)
                    )
                    for sec in secs_result.scalars().all():
                        await db.execute(
                            delete(Video).where(Video.section_id == sec.id)
                        )
                    await db.execute(
                        delete(Section).where(Section.module_id == mod.id)
                    )
                await db.execute(
                    delete(CourseModule).where(CourseModule.course_id == cid)
                )
            await db.execute(delete(Course))
            await db.flush()
            print("  Old data cleared.")

        # Create course
        course = Course(
            title=COURSE_TITLE,
            description=COURSE_DESCRIPTION,
        )
        db.add(course)
        await db.flush()

        total_lessons = 0
        for mod_idx, mod_data in enumerate(COURSE_MODULES):
            module = CourseModule(
                course_id=course.id,
                title=mod_data["title"],
                outcome=mod_data["outcome"],
                order_index=mod_idx,
                level=mod_data["level"],
            )
            db.add(module)
            await db.flush()

            for sec_idx, (lesson_title, duration_mins) in enumerate(mod_data["lessons"]):
                section = Section(
                    module_id=module.id,
                    title=lesson_title,
                    order_index=sec_idx,
                )
                db.add(section)
                await db.flush()

                video = Video(
                    section_id=section.id,
                    title=lesson_title,
                    cloudinary_public_id=None,        # ← set after Cloudinary upload
                    duration_seconds=duration_mins * 60,
                    thumbnail_cloudinary_id=None,
                    order_index=0,
                )
                db.add(video)
                total_lessons += 1

        await db.commit()
        print(f"Done. Seeded: {course.title}")
        print(f"  id={course.id}")
        print(f"  {len(COURSE_MODULES)} modules, {total_lessons} lessons")


if __name__ == "__main__":
    force = "--force" in sys.argv
    asyncio.run(seed(force=force))
