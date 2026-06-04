from pydantic import BaseModel, field_validator
from typing import Literal, Optional

TYPE = Literal["available", "partial", "unavailable"]
DAY = Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class AvailabilitySet(BaseModel):
    employee_id: str
    day: DAY
    type: TYPE
    note: Optional[str] = None

    @field_validator("note")
    @classmethod
    def note_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 200:
            raise ValueError("Note trop longue")
        return v


class AvailabilityOut(BaseModel):
    id: str
    employee_id: str
    day: str
    type: str
    note: Optional[str] = None
