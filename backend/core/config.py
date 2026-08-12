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
    environment: str = "development"
    pass_threshold: float = 0.70

    # WhatsApp Cloud API (Meta direct) — all optional; set in production to enable the channel
    whatsapp_token: str = ""              # permanent System User access token
    whatsapp_phone_number_id: str = ""    # from the WhatsApp > API setup screen
    whatsapp_verify_token: str = "cosmoplex-verify"  # you choose this; must match Meta webhook config
    graph_api_version: str = "v21.0"
    cloudinary_cloud_name: str = "dlpl4inio"  # for building lesson video links sent over WhatsApp
    whatsapp_templates_enabled: bool = False  # flip True once drip templates are approved by Meta
    cloudinary_api_key: str = ""              # for signed uploads from the admin portal
    cloudinary_api_secret: str = ""           # kept server-side only; never sent to the browser
    whatsapp_app_secret: str = ""              # Meta App Secret — verifies the webhook's X-Hub-Signature-256.
                                                # Optional (verification is skipped if unset) so existing
                                                # setups don't break, but set it before go-live.

    # Admin portal (hidden /admin) — single shared password
    admin_password: str = "change-me-admin"

    # Safety net: bounds worst-case AI spend from abuse or a runaway bug. Generous
    # default for the current scale; raise it (env var) as usage legitimately grows.
    daily_ai_call_limit: int = 2000

    # Referral program
    referral_reward_rupees: int = 50
    referral_demo_mode: bool = True       # True = NO real money moves; payouts auto-marked as demo
    whatsapp_business_number: str = "917204419938"  # for wa.me referral links (country code + number, no +)

    @field_validator("anthropic_api_key", "secret_key", "groq_api_key", "fal_api_key", "openai_api_key", "whatsapp_token", "cloudinary_api_key", "cloudinary_api_secret", "whatsapp_app_secret", "admin_password", mode="before")
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
