from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.dependencies import get_current_user, require_manager
from app.schemas.absence import AbsenceCreate, AbsenceUpdate, AbsenceOut
from app.utils.permissions import can_manage_absence, is_director, is_department_manager
from app.utils.audit import log_action
from app.utils.id import new_id
from app.database import get_db

router = APIRouter(prefix="/absences", tags=["absences"])


def _out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_absences(user: dict = Depends(get_current_user)):
    db = get_db()
    query: dict = {}
    if not is_director(user) and not is_department_manager(user):
        query["employee_id"] = user["id"]
    elif is_department_manager(user):
        query["department"] = user["department"]
    cursor = db.absences.find(query)
    return [_out(doc) async for doc in cursor]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_absence(body: AbsenceCreate, user: dict = Depends(get_current_user)):
    # Employees can only create for themselves
    if user["role"] == "employee" and body.employee_id != user["id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if is_department_manager(user) and body.department != user["department"]:
        raise HTTPException(status_code=403, detail="Département invalide")
    db = get_db()
    doc = body.model_dump()
    doc["_id"] = new_id()
    doc["status"] = "pending"
    await db.absences.insert_one(doc)
    await log_action("absence_created", user["id"], {"absence_id": doc["_id"]})
    return _out(doc)


@router.put("/{absence_id}")
async def update_absence(absence_id: str, body: AbsenceUpdate, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.absences.find_one({"_id": absence_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Absence introuvable")
    doc["id"] = absence_id
    if not can_manage_absence(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.absences.update_one({"_id": absence_id}, {"$set": updates})
    # When accepted, update related shift to 'absent'
    if body.status == "accepted":
        await db.shifts.update_many(
            {"employee_id": doc["employee_id"], "date": doc["date"]},
            {"$set": {"status": "absent"}},
        )
    await log_action("absence_updated", user["id"], {"absence_id": absence_id, "status": body.status})
    updated = await db.absences.find_one({"_id": absence_id})
    return _out(updated)


@router.delete("/{absence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_absence(absence_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.absences.find_one({"_id": absence_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Absence introuvable")
    doc["id"] = absence_id
    # Employee can only delete their own pending absences
    if user["role"] == "employee":
        if doc["employee_id"] != user["id"] or doc["status"] != "pending":
            raise HTTPException(status_code=403, detail="Accès refusé")
    elif not can_manage_absence(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    await db.absences.delete_one({"_id": absence_id})
    await log_action("absence_deleted", user["id"], {"absence_id": absence_id})
