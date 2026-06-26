import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import LearnerProfile
from core.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    learner: dict


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(LearnerProfile).where(LearnerProfile.email == body.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    learner = LearnerProfile(
        id=str(uuid.uuid4()),
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        preferred_language=body.language,
        current_module_id="m1",
    )
    db.add(learner)
    await db.commit()

    token = create_access_token({"sub": learner.id})
    return AuthResponse(
        access_token=token,
        learner={"id": learner.id, "name": learner.name},
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LearnerProfile).where(LearnerProfile.email == body.email)
    )
    learner = result.scalar_one_or_none()
    if not learner or not verify_password(body.password, learner.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": learner.id})
    return AuthResponse(
        access_token=token,
        learner={"id": learner.id, "name": learner.name},
    )
