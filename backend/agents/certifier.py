"""
Certifier Agent: Generates and delivers certificates.
CRITICAL: Only invoked AFTER deterministic code gate confirms eligibility.
The agent never decides if a learner passed — it only generates the artifact.
"""
import uuid
import os
import html
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
    # Escape the learner-supplied name — it is interpolated into the certificate
    # HTML and rendered by WeasyPrint, so a raw name could inject markup/CSS (or
    # a resource-fetching tag). Names are display-only here; escaping is safe.
    name = html.escape((name or "").strip()) or "Learner"
    # Format without a zero-padded day, portably (%-d isn't supported on Windows).
    try:
        issued = issued_at.strftime("%B %d, %Y").replace(" 0", " ")
    except Exception:
        issued = str(issued_at)
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4 landscape; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 297mm; height: 210mm; }}
  body {{
    font-family: 'Noto Sans', 'DejaVu Sans', Arial, sans-serif;
    color: #18181b; background: #ffffff;
  }}
  .serif {{ font-family: 'Noto Serif', 'DejaVu Serif', Georgia, 'Times New Roman', serif; }}

  .page {{ width: 297mm; height: 210mm; padding: 12mm; }}
  /* Double frame: outer thin rule + inner emerald border */
  .frame {{
    width: 100%; height: 100%;
    border: 1.5mm solid #059669;
    outline: 0.3mm solid #a7f3d0; outline-offset: 2mm;
    padding: 13mm 20mm;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }}

  .brand {{
    font-size: 15pt; font-weight: 700; letter-spacing: 0.42em;
    color: #059669; text-transform: uppercase; padding-left: 0.42em;
  }}
  .brand-rule {{ width: 26mm; height: 2.4pt; background: #059669; border-radius: 2pt; margin: 3.5mm auto 0; }}

  .eyebrow {{
    margin-top: 12mm; font-size: 10.5pt; letter-spacing: 0.34em;
    text-transform: uppercase; color: #71717a;
  }}
  .heading {{
    margin-top: 3mm; font-size: 27pt; font-weight: 700;
    letter-spacing: 0.02em; color: #111827;
  }}

  .present {{ margin-top: 11mm; font-size: 11.5pt; color: #6b7280; }}
  .name {{
    margin-top: 3mm; font-size: 40pt; font-weight: 700;
    color: #111827; line-height: 1.1;
  }}
  .name-rule {{ width: 95mm; height: 0.4pt; background: #d1d5db; margin: 6mm auto 0; }}

  .desc {{
    margin-top: 7mm; max-width: 195mm; font-size: 11.5pt;
    line-height: 1.75; color: #3f3f46;
  }}
  .desc strong {{ color: #059669; }}

  .spacer {{ flex: 1; }}

  .footer {{
    width: 100%; display: flex; align-items: flex-end;
    justify-content: space-between;
  }}
  .foot-col {{ width: 33%; }}
  .foot-val {{ font-size: 12pt; color: #18181b; font-weight: 600; }}
  .foot-line {{ border-top: 0.4pt solid #9ca3af; margin: 0 6mm; padding-top: 2mm; }}
  .foot-label {{ font-size: 8.5pt; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; margin-top: 1.5mm; }}

  /* Verification seal */
  .seal {{
    width: 26mm; height: 26mm; border-radius: 50%;
    border: 1mm solid #059669; background: #ecfdf5;
    margin: 0 auto; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }}
  .seal-top {{ font-size: 7pt; letter-spacing: 0.2em; color: #047857; text-transform: uppercase; }}
  .seal-check {{ font-size: 15pt; color: #059669; line-height: 1; margin: 0.6mm 0; }}
  .seal-bottom {{ font-size: 6.5pt; letter-spacing: 0.12em; color: #047857; text-transform: uppercase; }}
</style>
</head>
<body>
  <div class="page">
    <div class="frame">
      <div class="brand">Cosmoplex</div>
      <div class="brand-rule"></div>

      <div class="eyebrow">Certificate of Completion</div>
      <div class="heading serif">AI Literacy Certification</div>

      <div class="present">This certificate is proudly presented to</div>
      <div class="name serif">{name}</div>
      <div class="name-rule"></div>

      <div class="desc">
        for successfully completing the <strong>AI Literacy Certification</strong> course on the
        Cosmoplex platform — passing every module examination above the required threshold and
        completing all assigned practical tasks.
      </div>

      <div class="spacer"></div>

      <div class="footer">
        <div class="foot-col">
          <div class="foot-val">{issued}</div>
          <div class="foot-line"></div>
          <div class="foot-label">Date of Issue</div>
        </div>
        <div class="foot-col">
          <div class="seal">
            <div class="seal-top">Verified</div>
            <div class="seal-check">&#10003;</div>
            <div class="seal-bottom">Cosmoplex</div>
          </div>
        </div>
        <div class="foot-col">
          <div class="foot-val serif">Cosmoplex</div>
          <div class="foot-line"></div>
          <div class="foot-label">Issuing Authority</div>
        </div>
      </div>
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
