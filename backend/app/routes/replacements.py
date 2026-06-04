from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.dependencies import get_current_user, require_manager
from app.schemas.replacement import ReplacementCreate, ReplacementAssign, ReplacementOut
from app.utils.permissions import can_manage_replacement, is_director, is_department_manager
from app.utils.audit import log_action
from app.utils.id import new_id
from app.database import get_db

router = APIRouter(prefix="/replacements", tags=["replacements"])


def _out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_replacements(user: dict = Depends(get_current_user)):
    db = get_db()
    query: dict = {}
    if not is_director(user) and not is_department_manager(user):
        query = {"$or": [
            {"original_employee_id": user["id"]},
            {"replacement_employee_id": user["id"]},
        ]}
    elif is_department_manager(user):
        query["department"] = user["department"]
    cursor = db.replacements.find(query)
    return [_out(doc) async for doc in cursor]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_replacement(body: ReplacementCreate, user: dict = Depends(require_manager)):
    if is_department_manager(user) and body.department != user["department"]:
        raise HTTPException(status_code=403, detail="Département invalide")
    db = get_db()
    doc = body.model_dump()
    doc["_id"] = new_id()
    doc["status"] = "open"
    doc["replacement_employee_id"] = None
    await db.replacements.insert_one(doc)
    await log_action("replacement_created", user["id"], {"replacement_id": doc["_id"]})
    return _out(doc)


@router.put("/{replacement_id}/assign")
async def assign_replacement(replacement_id: str, body: ReplacementAssign, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.replacements.find_one({"_id": replacement_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Remplacement introuvable")
    doc["id"] = replacement_id
    if not can_manage_replacement(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    await db.replacements.update_one(
        {"_id": replacement_id},
        {"$set": {"replacement_employee_id": body.replacement_employee_id, "status": "assigned"}},
    )
    await log_action("replacement_assigned", user["id"], {"replacement_id": replacement_id})
    updated = await db.replacements.find_one({"_id": replacement_id})
    return _out(updated)


@router.delete("/{replacement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_replacement(replacement_id: str, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.replacements.find_one({"_id": replacement_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Remplacement introuvable")
    doc["id"] = replacement_id
    if not can_manage_replacement(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    await db.replacements.delete_one({"_id": replacement_id})
    await log_action("replacement_deleted", user["id"], {"replacement_id": replacement_id})
