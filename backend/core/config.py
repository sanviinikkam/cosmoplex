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

    @field_validator("anthropic_api_key", "secret_key", "groq_api_key", "fal_api_key", "openai_api_key", "whatsapp_token", mode="before")
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
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]
