from fastapi import APIRouter, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.schemas.auth import LoginRequest, TokenResponse
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_db
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    db = get_db()
    user = await db.employees.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})
    safe_user = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "department": user["department"],
        "phone": user.get("phone"),
        "note": user.get("note"),
    }
    return {"access_token": token, "token_type": "bearer", "user": safe_user}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user
