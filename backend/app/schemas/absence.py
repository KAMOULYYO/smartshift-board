from pydantic import BaseModel, field_validator
from typing import Literal, Optional
import re

URGENCY = Literal["low", "medium", "high"]
STATUS = Literal["pending", "accepted", "refused"]

ABSENCE_REASONS = [
    "Maladie", "Congé personnel", "Urgence familiale",
    "Rendez-vous médical", "Congé payé", "Formation", "Autre",
]


class AbsenceCreate(BaseModel):
    employee_id: str
    department: str
    date: str
    reason: str
    urgency: URGENCY = "low"
    comment: Optional[str] = None

    @field_validator("date")
    @classmethod
    def date_format(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Format de date invalide (YYYY-MM-DD)")
        return v

    @field_validator("reason")
    @classmethod
    def reason_valid(cls, v: str) -> str:
        if v not in ABSENCE_REASONS:
            raise ValueError(f"Motif invalide: {v}")
        return v

    @field_validator("comment")
    @classmethod
    def comment_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 300:
            raise ValueError("Commentaire trop long")
        return v


class AbsenceUpdate(BaseModel):
    status: Optional[STATUS] = None
    comment: Optional[str] = None


class AbsenceOut(BaseModel):
    id: str
    employee_id: str
    department: str
    date: str
    reason: str
    urgency: str
    comment: Optional[str] = None
    status: str
