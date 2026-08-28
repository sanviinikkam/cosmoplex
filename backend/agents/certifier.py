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


# ── Certificate authenticity: unique code + QR that opens the verify page ─────
# Codes must be unguessable (a guessable code lets anyone mint a "verified"
# certificate), so 8 chars from a 31-char alphabet ≈ 40 bits of entropy. The
# alphabet drops I/L/O/0/1 so a human reading the printed code cannot confuse
# characters when typing it in.
_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_certificate_code() -> str:
    """A fresh certificate id, e.g. 'CMPX-A7K2-9RTM'."""
    import secrets
    body = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
    return f"CMPX-{body[:4]}-{body[4:]}"


def verify_url_for(code: str) -> str:
    """Public URL the QR points at."""
    return f"{settings.verify_base_url.rstrip('/')}/verify/{code}"


def _qr_data_uri(url: str) -> str:
    """QR as an embedded PNG data URI. Embedded (not linked) so the PDF stays
    self-contained and WeasyPrint never makes a network request while rendering."""
    import io, base64
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                      box_size=10, border=1)
    q.add_data(url)
    q.make(fit=True)
    img = q.make_image(fill_color="#111827", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


# ── Brand ────────────────────────────────────────────────────────────────────
# Palette taken from the Cosmoplex logo: deep navy field, gold accent.
NAVY = "#0B1B33"
NAVY_SOFT = "#16305A"
GOLD = "#F5A524"
GOLD_SOFT = "#FDE9C4"
INK = "#111827"
MUTED = "#6B7280"

# Optional official logo. Drop the file at backend/assets/cosmoplex-logo.(svg|png)
# and it is embedded automatically — no code change. Until then the certificate
# falls back to the typographic wordmark, so issuing never depends on the asset.
_LOGO_CANDIDATES = ("cosmoplex-logo.svg", "cosmoplex-logo.png",
                    "cosmoplex-logo.jpg", "cosmoplex-logo.jpeg")


def _logo_data_uri() -> str | None:
    """The brand logo as a data URI, or None if no logo file is present."""
    import base64
    from pathlib import Path
    base = Path(__file__).resolve().parent.parent / "assets"
    for fname in _LOGO_CANDIDATES:
        f = base / fname
        if not f.is_file():
            continue
        try:
            raw = f.read_bytes()
        except Exception as e:
            print(f"WARN could not read logo {f}: {type(e).__name__}: {e}")
            continue
        mime = {"svg": "image/svg+xml", "png": "image/png",
                "jpg": "image/jpeg", "jpeg": "image/jpeg"}[f.suffix.lstrip(".").lower()]
        return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")
    return None


# Embedded SVG award medallion (ribboned seal with a checkmark). WeasyPrint
# renders inline SVG, so this stays crisp at any size. No external assets.
_SEAL_SVG = """<svg width="23mm" height="30.4mm" viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg">
  <path d="M41,70 L31,126 L40,118 L49,126 L49,76 Z" fill="#0B1B33"/>
  <path d="M59,70 L69,126 L60,118 L51,126 L51,76 Z" fill="#16305A"/>
  <circle cx="50" cy="46" r="44" fill="#0B1B33"/>
  <circle cx="50" cy="46" r="39.5" fill="none" stroke="#F5A524" stroke-width="1.4" stroke-dasharray="1.4 3.1"/>
  <circle cx="50" cy="46" r="35" fill="#FFFFFF"/>
  <circle cx="50" cy="46" r="30" fill="none" stroke="#F5A524" stroke-width="1.2"/>
  <path d="M39,45 L46,53 L61,34" fill="none" stroke="#0B1B33" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="50" y="68" text-anchor="middle" font-family="'Noto Sans','DejaVu Sans',sans-serif" font-size="8.5" font-weight="700" letter-spacing="1.4" fill="#0B1B33">VERIFIED</text>
</svg>"""


def _generate_certificate_html(name: str, issued_at: datetime, code: str | None = None) -> str:
    """Render the certificate. `code` is the public verification id — when given,
    the certificate carries it in print plus a QR to the verify page."""
    # Escape the learner-supplied name — it is interpolated into the certificate
    # HTML and rendered by WeasyPrint, so a raw name could inject markup/CSS (or
    # a resource-fetching tag). Names are display-only here; escaping is safe.
    name = html.escape((name or "").strip()) or "Learner"
    # Format without a zero-padded day, portably (%-d isn't supported on Windows).
    try:
        issued = issued_at.strftime("%B %d, %Y").replace(" 0", " ")
    except Exception:
        issued = str(issued_at)

    # Header lockup: the official logo when the asset is present, otherwise the
    # typographic wordmark. Either way it sits on the navy band, which is what
    # makes the light-on-dark brand mark legible on a white certificate.
    logo = _logo_data_uri()
    if logo:
        brand_html = f'<img class="logo" src="{logo}" alt="Cosmoplex">'
    else:
        brand_html = ('<div class="wordmark">COSMOPLE<span class="wm-accent">X</span></div>'
                      '<div class="tagline">Applied AI for the next 4 billion users</div>')

    # Verification block: printed code + QR. Both are omitted rather than shown
    # broken if anything fails, so a QR/render problem can never block issuing.
    code_html = ""
    qr_html = '<div class="foot-val serif">Cosmoplex</div><div class="foot-line"></div>'               '<div class="foot-label">Issuing Authority</div>'
    if code:
        safe_code = html.escape(code)
        code_html = f'<div class="cert-code">{safe_code}</div>'
        try:
            uri = _qr_data_uri(verify_url_for(code))
            qr_html = (f'<img class="qr" src="{uri}" alt="Verify this certificate">'
                       '<div class="foot-label qr-label">Scan to verify</div>')
        except Exception as e:  # QR is a nice-to-have; never fail issuing over it
            print(f"WARN certificate QR generation failed: {type(e).__name__}: {e}")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  /* NOTE: WeasyPrint's flexbox/grid support is unreliable — this layout uses
     only block flow, text-align, absolute positioning and CSS tables. */
  @page {{ size: A4 landscape; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 297mm; height: 210mm; }}
  body {{
    font-family: 'Noto Sans', 'DejaVu Sans', Arial, sans-serif;
    color: {INK}; background: #ffffff;
  }}
  .serif {{ font-family: 'Noto Serif', 'DejaVu Serif', Georgia, 'Times New Roman', serif; }}

  .page {{ width: 297mm; height: 210mm; padding: 9mm; }}
  /* Navy rule outside, gold hairline inside — the brand's two colours framing
     the document without tinting the body, which must stay printable. */
  .frame {{
    position: relative; width: 100%; height: 100%;
    border: 1.3mm solid {NAVY}; padding: 2.2mm; background: #ffffff;
  }}
  .inner {{ position: relative; width: 100%; height: 100%; border: 0.35mm solid {GOLD}; }}

  /* The logo is light-on-dark, so it gets a navy field to sit on. */
  .band {{
    background: {NAVY}; padding: 7mm 10mm 6.5mm; text-align: center;
    border-bottom: 0.7mm solid {GOLD};
  }}
  .logo {{ height: 19mm; }}
  .wordmark {{
    font-size: 17pt; font-weight: 700; letter-spacing: 0.4em;
    color: #ffffff; padding-left: 0.4em;
  }}
  .wm-accent {{ color: {GOLD}; }}
  .tagline {{
    margin-top: 2.6mm; font-size: 7.5pt; letter-spacing: 0.22em;
    text-transform: uppercase; color: #C7D2E4;
  }}

  .body {{ padding: 11mm 24mm 0; text-align: center; }}

  .eyebrow {{
    font-size: 10pt; letter-spacing: 0.34em; text-transform: uppercase; color: {MUTED};
  }}
  .heading {{ margin-top: 3mm; font-size: 25pt; font-weight: 700; color: {NAVY}; }}
  .heading-rule {{ width: 24mm; height: 1.6pt; background: {GOLD}; margin: 4mm auto 0; }}

  .present {{ margin-top: 8mm; font-size: 11.5pt; color: {MUTED}; }}
  .name {{ margin-top: 2.5mm; font-size: 36pt; font-weight: 700; color: {NAVY}; line-height: 1.1; }}
  .name-rule {{ width: 95mm; height: 0.5pt; background: #D5DCE6; margin: 5mm auto 0; }}

  .desc {{
    margin: 6mm auto 0; max-width: 198mm; font-size: 11pt;
    line-height: 1.75; color: #3F4756;
  }}
  .desc strong {{ color: {NAVY_SOFT}; }}

  /* Footer pinned to the frame (not the padded body) so the three columns are
     centred on the page: date | seal + id | QR. */
  .footer {{ position: absolute; left: 24mm; right: 24mm; bottom: 11mm; }}
  .foot-table {{ display: table; width: 100%; table-layout: fixed; }}
  .foot-col {{ display: table-cell; width: 33.33%; vertical-align: bottom; text-align: center; }}
  .foot-val {{ font-size: 12pt; color: {NAVY}; font-weight: 700; }}
  .foot-line {{ border-top: 0.5pt solid #9AA4B4; margin: 1.5mm 10mm 0; }}
  .foot-label {{ font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #98A2B3; margin-top: 1.5mm; }}
  .seal-wrap {{ text-align: center; }}
  .seal-wrap svg {{ display: inline-block; }}
  .cert-code {{
    margin-top: 2.2mm; font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
    font-size: 8.5pt; letter-spacing: 0.08em; color: {NAVY};
  }}
  .qr {{ width: 21mm; height: 21mm; display: inline-block; }}
  .qr-label {{ margin-top: 1mm; }}
</style>
</head>
<body>
  <div class="page">
    <div class="frame">
      <div class="inner">
        <div class="band">
          {brand_html}
        </div>

        <div class="body">
          <div class="eyebrow">Certificate of Completion</div>
          <div class="heading serif">AI Literacy Certification</div>
          <div class="heading-rule"></div>

          <div class="present">This certificate is proudly presented to</div>
          <div class="name serif">{name}</div>
          <div class="name-rule"></div>

          <div class="desc">
            for successfully completing the <strong>AI Literacy Certification</strong> course on the
            Cosmoplex platform — passing every module examination above the required threshold and
            completing all assigned practical tasks.
          </div>
        </div>

        <div class="footer">
          <div class="foot-table">
            <div class="foot-col">
              <div class="foot-val">{issued}</div>
              <div class="foot-line"></div>
              <div class="foot-label">Date of Issue</div>
            </div>
            <div class="foot-col">
              <div class="seal-wrap">{_SEAL_SVG}</div>
              {code_html}
            </div>
            <div class="foot-col">
              {qr_html}
            </div>
          </div>
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
