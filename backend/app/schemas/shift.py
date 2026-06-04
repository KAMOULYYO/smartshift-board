from pydantic import BaseModel, field_validator
from typing import Literal, Optional
import re

STATUS = Literal["planned", "completed", "absent", "replaced"]


class ShiftCreate(BaseModel):
    employee_id: str
    department: str
    date: str
    start_time: str
    end_time: str
    status: STATUS = "planned"
    note: Optional[str] = None

    @field_validator("date")
    @classmethod
    def date_format(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Format de date invalide (YYYY-MM-DD)")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def time_format(cls, v: str) -> str:
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Format d'heure invalide (HH:MM)")
        return v

    @field_validator("note")
    @classmethod
    def note_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 200:
            raise ValueError("Note trop longue")
        return v


class ShiftUpdate(BaseModel):
    department: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[STATUS] = None
    note: Optional[str] = None

    @field_validator("date")
    @classmethod
    def date_format(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Format de date invalide (YYYY-MM-DD)")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def time_format(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Format d'heure invalide (HH:MM)")
        return v


class ShiftOut(BaseModel):
    id: str
    employee_id: str
    department: str
    date: str
    start_time: str
    end_time: str
    status: str
    note: Optional[str] = None
