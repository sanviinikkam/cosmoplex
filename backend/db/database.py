import ssl as _ssl
from urllib.parse import urlsplit

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from .models import Base
from core.config import settings

# Managed Postgres hosts (Neon, Supabase, Render) require SSL; local dev doesn't.
# asyncpg wants an SSL context via connect_args, not a URL "sslmode" param.
_host = (urlsplit(settings.database_url.replace("+asyncpg", "")).hostname or "").lower()
_connect_args: dict = {}
if _host not in ("localhost", "127.0.0.1", "", "::1"):
    _connect_args["ssl"] = _ssl.create_default_context()

engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    # Serverless-DB (Neon) friendly pooling. pre_ping transparently reconnects
    # after Neon resumes from scale-to-zero; pool_recycle drops connections older
    # than 5 min (Neon will have closed them during a suspend) so we never hand
    # out a dead one; a smaller pool means fewer lingering idle connections.
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
