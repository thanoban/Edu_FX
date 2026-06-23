from pydantic import BaseModel, Field


class BehaviourSnapshotRequest(BaseModel):
    student_id: int
    session_id: int
    face_detected: bool = True
    looking_away: bool = False
    phone_detected: bool = False
    drowsy: bool = False
    multiple_persons: bool = False
    talking: bool = False
    absent: bool = False
    focus_score: int = Field(ge=0, le=100)


class BehaviourSummaryRequest(BaseModel):
    student_id: int
    session_id: int
    subtopic_id: int
    webcam_enabled: bool = False
    phone_percent: int = Field(default=0, ge=0, le=100)
    drowsy_percent: int = Field(default=0, ge=0, le=100)
    away_percent: int = Field(default=0, ge=0, le=100)
    talking_percent: int = Field(default=0, ge=0, le=100)
    absent_percent: int = Field(default=0, ge=0, le=100)
    focus_score: int = Field(default=0, ge=0, le=100)
