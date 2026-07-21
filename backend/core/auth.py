from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import LearnerProfile
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


admin_scheme = HTTPBearer(auto_error=False)


def create_admin_token() -> str:
    return create_access_token({"sub": "admin", "role": "admin"})


async def require_admin(
    creds: HTTPAuthorizationCredentials = Depends(admin_scheme),
) -> bool:
    """Guard for /admin endpoints — requires a valid admin-scoped JWT."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Admin authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise exc
    try:
        payload = jwt.decode(creds.credentials, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise exc
    if payload.get("role") != "admin":
        raise exc
    return True


async def get_current_learner(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> LearnerProfile:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        learner_id: str = payload.get("sub")  # type: ignore
        if learner_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    result = await db.execute(
        select(LearnerProfile).where(LearnerProfile.id == learner_id)
    )
    learner = result.scalar_one_or_none()
    if learner is None:
        raise credentials_exc
    return learner
