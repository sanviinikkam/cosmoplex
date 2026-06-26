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
