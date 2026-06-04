from pydantic import BaseModel, field_validator
from typing import Literal, Optional
import re

STATUS = Literal["open", "assigned"]


class ReplacementCreate(BaseModel):
    absence_id: str
    original_employee_id: str
    department: str
    date: str
    start_time: str
    end_time: str

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


class ReplacementAssign(BaseModel):
    replacement_employee_id: str


class ReplacementOut(BaseModel):
    id: str
    absence_id: str
    original_employee_id: str
    replacement_employee_id: Optional[str] = None
    department: str
    date: str
    start_time: str
    end_time: str
    status: str
