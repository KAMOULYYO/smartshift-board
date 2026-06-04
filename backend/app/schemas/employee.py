from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
import re

ROLES = Literal["director", "assistant_manager", "manager", "employee"]

DEPARTMENTS = [
    "Caisse", "Fruits et légumes", "Viande", "Boulangerie",
    "Épicerie", "Produits laitiers", "Réception", "Administration",
]


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: ROLES
    department: str
    phone: Optional[str] = None
    note: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Le nom est requis")
        if len(v) > 100:
            raise ValueError("Nom trop long (max 100 caractères)")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mot de passe trop court (min 6 caractères)")
        return v

    @field_validator("department")
    @classmethod
    def department_valid(cls, v: str) -> str:
        if v not in DEPARTMENTS:
            raise ValueError(f"Département invalide: {v}")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = re.sub(r"[^\d\s\+\-\(\)\.]", "", v)[:20]
        return v or None

    @field_validator("note")
    @classmethod
    def note_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 200:
            raise ValueError("Note trop longue (max 200 caractères)")
        return v


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[ROLES] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    note: Optional[str] = None

    @field_validator("department")
    @classmethod
    def department_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in DEPARTMENTS:
            raise ValueError(f"Département invalide: {v}")
        return v


class EmployeeOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    phone: Optional[str] = None
    note: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mot de passe trop court (min 6 caractères)")
        return v
