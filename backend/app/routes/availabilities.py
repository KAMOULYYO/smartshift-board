from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.auth.dependencies import get_current_user
from app.schemas.availability import AvailabilitySet, AvailabilityOut
from app.utils.permissions import is_director, is_department_manager
from app.utils.id import new_id
from app.database import get_db

router = APIRouter(prefix="/availabilities", tags=["availabilities"])


def _out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def _can_edit(user: dict, employee_id: str, department: str) -> bool:
    if is_director(user):
        return True
    if is_department_manager(user):
        return user["department"] == department
    return user["id"] == employee_id


@router.get("")
async def list_availabilities(employee_id: str = Query(None), user: dict = Depends(get_current_user)):
    db = get_db()
    query: dict = {}
    if employee_id:
        query["employee_id"] = employee_id
    elif not is_director(user) and not is_department_manager(user):
        query["employee_id"] = user["id"]
    cursor = db.availabilities.find(query)
    return [_out(doc) async for doc in cursor]


@router.put("")
async def set_availability(body: AvailabilitySet, user: dict = Depends(get_current_user)):
    db = get_db()
    # Resolve employee department for permission check
    emp = await db.employees.find_one({"_id": body.employee_id}, {"department": 1})
    if not emp:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    if not _can_edit(user, body.employee_id, emp["department"]):
        raise HTTPException(status_code=403, detail="Accès refusé")
    doc = body.model_dump()
    existing = await db.availabilities.find_one({"employee_id": body.employee_id, "day": body.day})
    if existing:
        await db.availabilities.update_one(
            {"_id": existing["_id"]},
            {"$set": {"type": body.type, "note": body.note}},
        )
        existing["type"] = body.type
        existing["note"] = body.note
        return _out(existing)
    doc["_id"] = new_id()
    await db.availabilities.insert_one(doc)
    return _out(doc)
