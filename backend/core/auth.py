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


# The three admin roles. "super" keeps everything the single password used to
# reach; the other two are strict subsets.
ADMIN_SUPER = "super"
ADMIN_CONTENT = "content"
ADMIN_MARKETING = "marketing"
ADMIN_ROLES = (ADMIN_SUPER, ADMIN_CONTENT, ADMIN_MARKETING)


def create_admin_token(admin_role: str = ADMIN_SUPER) -> str:
    if admin_role not in ADMIN_ROLES:
        raise ValueError(f"unknown admin role: {admin_role}")
    # role="admin" is kept so any existing check still passes; "adm" carries the
    # new, finer role.
    return create_access_token({"sub": f"admin:{admin_role}", "role": "admin",
                                "adm": admin_role})


def _admin_role_from(creds: HTTPAuthorizationCredentials | None) -> str:
    """The admin role a bearer token carries, or raise 401.

    A token minted before roles existed has no "adm" claim. Those were issued by
    the single ADMIN_PASSWORD, which is now the SUPER password — so treating a
    missing claim as super preserves exactly the access that token already had
    and is not a privilege escalation.
    """
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
    adm = payload.get("adm") or ADMIN_SUPER
    if adm not in ADMIN_ROLES:
        raise exc
    return adm


async def admin_role(
    creds: HTTPAuthorizationCredentials = Depends(admin_scheme),
) -> str:
    """Dependency giving the caller's admin role. Use when an endpoint serves
    several roles but must vary what it returns."""
    return _admin_role_from(creds)


def require_roles(*allowed: str):
    """Dependency factory: allow only these admin roles.

    Authorization lives here, on the server, for every endpoint. Hiding a tab in
    the UI is presentation only — the token is in the browser and the API is
    public, so a hidden panel is not a permission.
    """
    for r in allowed:
        if r not in ADMIN_ROLES:
            raise ValueError(f"unknown admin role: {r}")

    async def _dep(creds: HTTPAuthorizationCredentials = Depends(admin_scheme)) -> str:
        role = _admin_role_from(creds)     # 401 if not an admin at all
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your admin role does not have access to this.",
            )
        return role

    # Tagged so the permission matrix can be audited by introspection instead of
    # by firing 138 HTTP requests at a booted app.
    _dep.allowed_roles = tuple(allowed)
    _dep.__name__ = "require_roles_" + "_".join(allowed)
    return _dep


async def require_admin(
    creds: HTTPAuthorizationCredentials = Depends(admin_scheme),
) -> bool:
    """Guard for /admin endpoints — any of the three admin roles."""
    _admin_role_from(creds)
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
