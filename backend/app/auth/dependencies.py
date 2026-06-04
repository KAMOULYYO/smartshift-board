from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.security import decode_token
from app.database import get_db

bearer = HTTPBearer()

ROLES = {"director", "assistant_manager", "manager", "employee"}
MANAGER_ROLES = {"director", "assistant_manager", "manager"}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    db = get_db()
    user = await db.employees.find_one({"_id": payload.get("sub")}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    user["id"] = str(user.pop("_id"))
    return user


async def require_manager(user: dict = Depends(get_current_user)):
    if user.get("role") not in MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux managers")
    return user


async def require_director(user: dict = Depends(get_current_user)):
    if user.get("role") != "director":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé à la direction")
    return user
