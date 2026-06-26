"""
Certifier Agent: Generates and delivers certificates.
CRITICAL: Only invoked AFTER deterministic code gate confirms eligibility.
The agent never decides if a learner passed — it only generates the artifact.
"""
import uuid
import os
from datetime import datetime
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from anthropic import AsyncAnthropic
from core.config import settings
from agents.base import LearnerState, COURSE_MODULES
from db.models import Certificate, ExamAttempt, TaskAssignment, LearnerProfile

client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def is_eligible_for_certificate(
    learner_id: str, course_id: str, db: AsyncSession
) -> tuple[bool, str]:
    """
    Deterministic Python gate. The LLM is never asked whether a learner passed.
    Returns (eligible: bool, reason: str).
    """
    for module in COURSE_MODULES:
        module_id = module["id"]

        # Check best exam score for this module
        result = await db.execute(
            select(func.max(ExamAttempt.score)).where(
                and_(
                    ExamAttempt.learner_id == learner_id,
                    ExamAttempt.module_id == module_id,
                )
            )
        )
        best_score = result.scalar()
        if best_score is None or best_score < settings.pass_threshold:
            return False, f"Module {module_id} not passed (score: {best_score})"

        # Check task completion
        task_result = await db.execute(
            select(TaskAssignment).where(
                and_(
                    TaskAssignment.learner_id == learner_id,
                    TaskAssignment.module_id == module_id,
                    TaskAssignment.status == "submitted",
                )
            )
        )
        if not task_result.scalar_one_or_none():
            return False, f"Task for module {module_id} not submitted"

    return True, "All requirements met"


def _generate_certificate_html(name: str, issued_at: datetime) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Inter', sans-serif; background: white; }}
  .cert {{ width: 842px; height: 595px; padding: 60px 80px; display: flex; flex-direction: column; justify-content: space-between; border: 3px solid #059669; }}
  .header {{ font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a; }}
  .title {{ font-size: 13px; color: #3f3f46; margin-top: 24px; }}
  .name {{ font-size: 48px; font-weight: 700; color: #18181b; margin-top: 8px; letter-spacing: -1px; }}
  .body {{ font-size: 14px; color: #52525b; line-height: 1.6; max-width: 560px; margin-top: 16px; }}
  .footer {{ display: flex; justify-content: space-between; align-items: flex-end; }}
  .date {{ font-size: 12px; color: #71717a; }}
  .brand {{ font-size: 18px; font-weight: 700; color: #18181b; }}
  .verified {{ display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 20px; }}
  .stripe {{ height: 6px; background: #059669; margin-bottom: 40px; }}
</style>
</head>
<body>
<div class="cert">
  <div>
    <div class="header">Certificate of Completion</div>
    <div class="title">This certifies that</div>
    <div class="name">{name}</div>
    <div class="body">
      has successfully completed the <strong>AI Literacy Certification</strong> course on the Cosmoplexx platform,
      passing all module examinations above the required threshold and completing all assigned practical tasks.
    </div>
    <div class="verified">Verified by Cosmoplexx</div>
  </div>
  <div class="footer">
    <div class="date">Issued: {issued_at.strftime("%B %d, %Y")}</div>
    <div class="brand">Cosmoplexx</div>
  </div>
</div>
</body>
</html>"""


async def run_certifier(
    state: LearnerState, db: AsyncSession
) -> tuple[str, str | None]:
    """
    Returns (message, pdf_url_or_none).
    First checks eligibility gate, then generates certificate if eligible.
    """
    eligible, reason = await is_eligible_for_certificate(
        state.learner_id, "ai-literacy-v1", db
    )

    if not eligible:
        return (
            f"Your certificate is not yet available. {reason}. "
            "Complete all module exams and tasks to qualify.",
            None,
        )

    # Check if already issued
    existing = await db.execute(
        select(Certificate).where(
            Certificate.learner_id == state.learner_id,
            Certificate.course_id == "ai-literacy-v1",
        )
    )
    existing_cert = existing.scalar_one_or_none()
    if existing_cert and existing_cert.pdf_path:
        return (
            "Your certificate has already been issued. You can download it from the Certificate page.",
            f"/certificates/{os.path.basename(existing_cert.pdf_path)}",
        )

    # Get learner name
    learner_result = await db.execute(
        select(LearnerProfile).where(LearnerProfile.id == state.learner_id)
    )
    learner = learner_result.scalar_one()
    issued_at = datetime.utcnow()

    # Generate PDF
    pdf_path = None
    pdf_url = None
    try:
        from weasyprint import HTML as WP_HTML
        cert_dir = Path("certificates")
        cert_dir.mkdir(exist_ok=True)
        html_content = _generate_certificate_html(learner.name, issued_at)
        filename = f"cert_{state.learner_id}.pdf"
        pdf_path = str(cert_dir / filename)
        WP_HTML(string=html_content).write_pdf(pdf_path)
        pdf_url = f"/certificates/{filename}"
    except ImportError:
        pdf_path = None
        pdf_url = None

    # Persist certificate record (unique constraint prevents duplicates)
    cert = Certificate(
        id=str(uuid.uuid4()),
        learner_id=state.learner_id,
        course_id="ai-literacy-v1",
        issued_at=issued_at,
        pdf_path=pdf_path,
        verified=True,
    )
    db.add(cert)
    learner.certificate_issued = True
    await db.commit()

    if pdf_url:
        return (
            f"Congratulations, {learner.name}. Your AI Literacy Certificate has been generated. "
            "You can download it from the Certificate page.",
            pdf_url,
        )
    else:
        return (
            f"Congratulations, {learner.name}. You have completed the AI Literacy Certification. "
            "Your certificate has been recorded. (PDF generation requires WeasyPrint to be installed.)",
            None,
        )
