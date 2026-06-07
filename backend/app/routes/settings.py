from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user, require_director
from app.database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])

SETTINGS_ID = "app_settings"


@router.get("")
async def get_settings(user: dict = Depends(get_current_user)):
    """Public settings readable by all authenticated users (logo, store name…)"""
    db = get_db()
    doc = await db.app_settings.find_one({"_id": SETTINGS_ID})
    if not doc:
        return {}
    doc.pop("_id", None)
    return doc


@router.post("")
async def save_settings(body: dict, user: dict = Depends(require_director)):
    """Only directors can update app settings."""
    db = get_db()
    await db.app_settings.update_one(
        {"_id": SETTINGS_ID},
        {"$set": body},
        upsert=True,
    )
    return {"ok": True}
