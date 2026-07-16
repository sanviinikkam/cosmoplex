import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return str(uuid.uuid4())


class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    preferred_language = Column(String(10), nullable=False, default="en")
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    current_module_id = Column(String(50), nullable=True)
    total_score = Column(Float, default=0.0)
    certificate_issued = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    module_progress = relationship("ModuleProgress", back_populates="learner", lazy="select")
    exam_attempts = relationship("ExamAttempt", back_populates="learner", lazy="select")
    task_assignments = relationship("TaskAssignment", back_populates="learner", lazy="select")
    certificates = relationship("Certificate", back_populates="learner", lazy="select")
    agent_events = relationship("AgentEvent", back_populates="learner", lazy="select")
    video_progress = relationship("VideoProgress", back_populates="learner", lazy="select")
    professional_context = relationship("LearnerProfessionalContext", back_populates="learner",
                                        uselist=False, lazy="select")
    learning_context = relationship("LearnerLearningContext", back_populates="learner",
                                    uselist=False, lazy="select")
    enrollments = relationship("CourseEnrollment", back_populates="learner", lazy="select")


class ModuleProgress(Base):
    __tablename__ = "module_progress"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    module_id = Column(String(50), nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="available")  # available | in_progress | completed

    learner = relationship("LearnerProfile", back_populates="module_progress")


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    module_id = Column(String(50), nullable=False)
    attempt_number = Column(Integer, default=1)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    learner = relationship("LearnerProfile", back_populates="exam_attempts")


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    task_id = Column(String(50), nullable=False)
    module_id = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="assigned")  # assigned | in_progress | submitted | reviewed

    learner = relationship("LearnerProfile", back_populates="task_assignments")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    course_id = Column(String(50), nullable=False, default="ai-literacy-v1")
    issued_at = Column(DateTime, default=datetime.utcnow)
    pdf_path = Column(String(500), nullable=True)
    verified = Column(Boolean, default=True)

    __table_args__ = (UniqueConstraint("learner_id", "course_id", name="uq_certificate_learner_course"),)

    learner = relationship("LearnerProfile", back_populates="certificates")


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    agent_name = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    learner = relationship("LearnerProfile", back_populates="agent_events")


# ── Extended learner profile graph ───────────────────────────────────────────

class LearnerProfessionalContext(Base):
    __tablename__ = "learner_professional_context"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"),
                        nullable=False, unique=True)

    # Employment
    employment_status = Column(String(30), nullable=True)   # working|studying|between_jobs|freelancing
    job_role = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    industry = Column(String(200), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    target_job_role = Column(String(200), nullable=True)    # for students / career changers

    # Education (optional)
    college = Column(String(200), nullable=True)
    degree = Column(String(200), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    hometown = Column(String(200), nullable=True)
    prior_ai_exposure = Column(String(20), nullable=True)   # none|basic|intermediate|advanced

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    learner = relationship("LearnerProfile", back_populates="professional_context")


class LearnerLearningContext(Base):
    __tablename__ = "learner_learning_context"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"),
                        nullable=False, unique=True)

    learning_objective = Column(Text, nullable=True)
    objective_tags = Column(JSONB, nullable=True, default=list)  # ['career_change','curiosity',...]
    daily_time_mins = Column(Integer, nullable=True, default=30)  # 15|30|45|60
    preferred_learning_time = Column(String(20), nullable=True)   # morning|afternoon|evening|night
    drip_enabled = Column(Boolean, default=True)
    drip_time = Column(String(5), nullable=True, default="09:00")  # HH:MM
    streak_count = Column(Integer, default=0)
    last_active_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    learner = relationship("LearnerProfile", back_populates="learning_context")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    course_id = Column(UUID(as_uuid=False), ForeignKey("courses.id"), nullable=False)
    persona_label = Column(String(100), nullable=False)
    module_sequence = Column(JSONB, nullable=False)   # [{"module_id": "uuid", "variant": "core|applied|deep"}]
    payment_status = Column(String(20), default="pending")  # pending|active|refunded
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("learner_id", "course_id", name="uq_enrollment_learner_course"),
    )

    learner = relationship("LearnerProfile", back_populates="enrollments")


# ── Video course models ───────────────────────────────────────────────────────

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_cloudinary_id = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    modules = relationship(
        "CourseModule", back_populates="course",
        order_by="CourseModule.order_index", lazy="select"
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    course_id = Column(UUID(as_uuid=False), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    outcome = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    level = Column(Integer, nullable=False, default=1)   # 1=Beginner 2=Intermediate 3=Advanced

    course = relationship("Course", back_populates="modules")
    sections = relationship(
        "Section", back_populates="module",
        order_by="Section.order_index", lazy="select"
    )


class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    module_id = Column(UUID(as_uuid=False), ForeignKey("course_modules.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, nullable=False)

    module = relationship("CourseModule", back_populates="sections")
    videos = relationship(
        "Video", back_populates="section",
        order_by="Video.order_index", lazy="select"
    )


class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    section_id = Column(UUID(as_uuid=False), ForeignKey("sections.id"), nullable=False)
    title = Column(String(255), nullable=False)
    cloudinary_public_id = Column(String(500), nullable=True)   # null = not yet uploaded
    duration_seconds = Column(Integer, nullable=True)
    thumbnail_cloudinary_id = Column(String(500), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    section = relationship("Section", back_populates="videos")
    progress_records = relationship("VideoProgress", back_populates="video", lazy="select")
    language_variants = relationship("VideoLanguageVariant", back_populates="video", lazy="select")


class VideoLanguageVariant(Base):
    """One Cloudinary public ID per (video, language) pair.

    When a learner watches a video, the backend picks the variant that
    matches their preferred_language and falls back to 'en' if unavailable.
    """
    __tablename__ = "video_language_variants"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    video_id = Column(UUID(as_uuid=False), ForeignKey("videos.id"), nullable=False)
    language = Column(String(10), nullable=False)          # en | hi | mr | ...
    cloudinary_public_id = Column(String(500), nullable=False)
    duration_seconds = Column(Integer, nullable=True)      # override if lang version differs

    __table_args__ = (
        UniqueConstraint("video_id", "language", name="uq_video_language_variant"),
    )

    video = relationship("Video", back_populates="language_variants")


class LessonAssignmentSubmission(Base):
    __tablename__ = "lesson_assignment_submissions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    lesson_title = Column(String(500), nullable=False)
    assignment_id = Column(String(50), nullable=False)
    answer = Column(Text, nullable=False)
    score = Column(Float, nullable=True)          # 0-100, set after evaluation
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    learner = relationship("LearnerProfile")


class VideoProgress(Base):
    __tablename__ = "video_progress"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    learner_id = Column(UUID(as_uuid=False), ForeignKey("learner_profiles.id"), nullable=False)
    video_id = Column(UUID(as_uuid=False), ForeignKey("videos.id"), nullable=False)
    watched_seconds = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    last_watched_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("learner_id", "video_id", name="uq_video_progress_learner_video"),
    )

    learner = relationship("LearnerProfile", back_populates="video_progress")
    video = relationship("Video", back_populates="progress_records")


class WhatsAppSession(Base):
    """Conversation state for a WhatsApp user, keyed by phone number.

    WhatsApp users are anonymous until they enrol, so we track their chosen
    language and where they are in the flow here (separate from LearnerProfile).
    """
    __tablename__ = "whatsapp_sessions"

    phone = Column(String(30), primary_key=True)          # e.g. "919876543210"
    language = Column(String(10), nullable=True)           # en | hi | mr | te | ta | kn
    stage = Column(String(30), default="new")              # new | lesson | quiz | quiz_failed | assignment | done
    lesson_index = Column(Integer, default=0)              # position in the lesson list
    quiz_index = Column(Integer, default=0)                # current quiz question (0-based)
    quiz_correct = Column(Integer, default=0)              # correct answers so far this attempt
    name = Column(String(255), nullable=True)
    current_status = Column(String(50), nullable=True)     # onboarding: student | graduate | working | jobseeker
    goal = Column(Text, nullable=True)                     # onboarding: their stated goal with AI
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
