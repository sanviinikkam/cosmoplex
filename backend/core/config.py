from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    database_url: str = "postgresql+asyncpg://cosmoplexx:password@localhost:5432/cosmoplexx"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    groq_api_key: str = ""
    fal_api_key: str = ""
    openai_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    # Public base URL of THIS backend (Render), e.g. https://cosmoplex-api.onrender.com
    # — used to build public links to generated files (e.g. the WhatsApp certificate
    # PDF, which Meta's servers must be able to fetch). No trailing slash.
    backend_url: str = ""
    # Public site URL used to build certificate verification links (the QR target).
    # Defaults to the production domain so the QR is correct without extra env setup.
    verify_base_url: str = "https://ailiteracy.cosmoplex.ai"
    environment: str = "development"
    pass_threshold: float = 0.70

    # Web learning channel (signup/login, course APIs, learn WebSocket). OFF:
    # WhatsApp is the only learner channel. Those endpoints had unauthenticated
    # holes, so the whole surface stays disabled rather than partially patched.
    # Does NOT affect the admin portal or the WhatsApp webhook.
    web_channel_enabled: bool = False

    # WhatsApp Cloud API (Meta direct) — all optional; set in production to enable the channel
    whatsapp_token: str = ""              # permanent System User access token
    whatsapp_phone_number_id: str = ""    # from the WhatsApp > API setup screen
    whatsapp_verify_token: str = "cosmoplex-verify"  # you choose this; must match Meta webhook config
    # Separate high-entropy key for the OPS endpoints (/run-drip, /setup, /register,
    # /subscribe, /diag*). These used to reuse whatsapp_verify_token, which is a
    # low-entropy, semi-public value (it's echoed in Meta's webhook handshake), so
    # guessing it allowed blasting every learner or re-registering the number.
    # FAIL CLOSED: if this is unset, every ops endpoint is refused.
    whatsapp_ops_key: str = ""
    graph_api_version: str = "v21.0"
    cloudinary_cloud_name: str = "dlpl4inio"  # for building lesson video links sent over WhatsApp
    whatsapp_templates_enabled: bool = False  # flip True once drip templates are approved by Meta
    # Course nudges (resume_lesson, finish_quiz, ...) are designed to land INSIDE
    # the free 24h window. If one drifts outside it, only a paid template could
    # deliver — so it is skipped instead. Flip this True only once per-language
    # templates are actually approved; today they exist in English only, so those
    # sends are rejected by Meta anyway. Pre-sale tiers are unaffected: they are
    # outside the window by design and legitimately use templates.
    paid_course_nudges: bool = False
    cloudinary_api_key: str = ""              # for signed uploads from the admin portal
    cloudinary_api_secret: str = ""           # kept server-side only; never sent to the browser
    whatsapp_app_secret: str = ""              # Meta App Secret — verifies the webhook's X-Hub-Signature-256.
                                                # Optional (verification is skipped if unset) so existing
                                                # setups don't break, but set it before go-live.

    # Admin portal (hidden /admin) — single shared password
    # Super admin only. The content/marketing passwords are NOT env vars — they
    # are bcrypt hashes in app_settings, set from the admin UI (core/admin_users.py).
    admin_password: str = "change-me-admin"

    # Safety net: bounds worst-case AI spend from abuse or a runaway bug. Generous
    # default for the current scale; raise it (env var) as usage legitimately grows.
    daily_ai_call_limit: int = 2000

    # Referral program
    referral_reward_rupees: int = 50
    referral_demo_mode: bool = True       # True = NO real money moves; payouts auto-marked as demo
    whatsapp_business_number: str = "917204419938"  # for wa.me referral links (country code + number, no +)

    @field_validator("anthropic_api_key", "secret_key", "groq_api_key", "fal_api_key", "openai_api_key", "whatsapp_token", "cloudinary_api_key", "cloudinary_api_secret", "whatsapp_app_secret", "admin_password", "whatsapp_ops_key", mode="before")
    @classmethod
    def _strip_secret(cls, v):
        # Pasted secrets often pick up trailing newlines/spaces, which break
        # HTTP headers (e.g. the Anthropic API key) — strip them defensively.
        return v.strip() if isinstance(v, str) else v

    @field_validator("database_url")
    @classmethod
    def _ensure_asyncpg_driver(cls, v: str) -> str:
        # Managed hosts (Render/Heroku) hand out "postgres://" or "postgresql://"
        # URLs. SQLAlchemy's async engine needs the asyncpg driver explicitly.
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Neon/Supabase append libpq params (sslmode, channel_binding) that the
        # asyncpg driver rejects. Strip them — SSL is handled in database.py.
        parts = urlsplit(v)
        if parts.query:
            kept = [(k, val) for k, val in parse_qsl(parts.query)
                    if k not in ("sslmode", "channel_binding")]
            v = urlunsplit(parts._replace(query=urlencode(kept)))
        return v

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
