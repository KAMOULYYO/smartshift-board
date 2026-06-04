from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.auth.dependencies import get_current_user, require_manager
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftOut
from app.utils.permissions import can_manage_shift, is_director, is_department_manager
from app.utils.audit import log_action
from app.database import get_db
from app.utils.id import new_id

router = APIRouter(prefix="/shifts", tags=["shifts"])


def _out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_shifts(
    week_start: str = Query(None),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {}
    if week_start:
        from datetime import date, timedelta
        try:
            start = date.fromisoformat(week_start)
            end = start + timedelta(days=6)
            query["date"] = {"$gte": week_start, "$lte": end.isoformat()}
        except ValueError:
            pass

    if not is_director(user) and not is_department_manager(user):
        query["employee_id"] = user["id"]
    elif is_department_manager(user):
        query["department"] = user["department"]

    cursor = db.shifts.find(query)
    return [_out(doc) async for doc in cursor]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_shift(body: ShiftCreate, user: dict = Depends(require_manager)):
    if is_department_manager(user) and body.department != user["department"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez créer des shifts que dans votre département")
    db = get_db()
    doc = body.model_dump()
    doc["_id"] = new_id()
    await db.shifts.insert_one(doc)
    await log_action("shift_created", user["id"], {"shift_id": doc["_id"]})
    return _out(doc)


@router.put("/{shift_id}")
async def update_shift(shift_id: str, body: ShiftUpdate, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.shifts.find_one({"_id": shift_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Shift introuvable")
    doc["id"] = shift_id
    if not can_manage_shift(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.shifts.update_one({"_id": shift_id}, {"$set": updates})
    await log_action("shift_updated", user["id"], {"shift_id": shift_id})
    updated = await db.shifts.find_one({"_id": shift_id})
    return _out(updated)


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(shift_id: str, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.shifts.find_one({"_id": shift_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Shift introuvable")
    doc["id"] = shift_id
    if not can_manage_shift(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    await db.shifts.delete_one({"_id": shift_id})
    await log_action("shift_deleted", user["id"], {"shift_id": shift_id})
