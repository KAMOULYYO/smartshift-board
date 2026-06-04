"""
Routes pour :
  - Publication du planning de la semaine (directeur/manager)
  - Confirmation de lecture par les employés (signature)
  - Check-in / Check-out des shifts
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.auth.dependencies import get_current_user, require_manager
from app.utils.permissions import is_director, is_department_manager
from app.utils.audit import log_action
from app.database import get_db
from app.utils.id import new_id

router = APIRouter(prefix="/planning", tags=["planning"])

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Schemas ──────────────────────────────────────────────────────────────────

class PublishBody(BaseModel):
    week: str           # ISO date du lundi (ex: 2025-01-06)
    department: str = ""

class ConfirmBody(BaseModel):
    week: str

class CheckinBody(BaseModel):
    shift_id: str
    action: str         # "checkin" | "checkout"


# ── Publication ──────────────────────────────────────────────────────────────

@router.post("/publish", status_code=status.HTTP_201_CREATED)
async def publish_planning(body: PublishBody, user: dict = Depends(require_manager)):
    db = get_db()
    # Un seul document par semaine (+ département pour les managers)
    dept = body.department or (user.get("department") if is_department_manager(user) else "")
    existing = await db.planning_publications.find_one({"week": body.week, "department": dept})
    if existing:
        # Mettre à jour la date de publication
        await db.planning_publications.update_one(
            {"_id": existing["_id"]},
            {"$set": {"published_at": now_iso(), "published_by": user["id"]}}
        )
        return {"week": body.week, "department": dept, "status": "updated"}
    doc = {
        "_id": new_id(),
        "week": body.week,
        "department": dept,
        "published_by": user["id"],
        "published_at": now_iso(),
    }
    await db.planning_publications.insert_one(doc)
    await log_action("planning_published", user["id"], {"week": body.week, "department": dept})
    return {"week": body.week, "department": dept, "status": "published"}


@router.get("/status/{week}")
async def get_planning_status(week: str, user: dict = Depends(get_current_user)):
    db = get_db()
    # Publication
    dept_filter = {} if is_director(user) else {"department": user.get("department", "")}
    pub = await db.planning_publications.find_one({"week": week, **dept_filter})
    published = pub is not None
    published_at = pub["published_at"] if pub else None

    # Confirmations
    conf_query = {"week": week}
    if is_department_manager(user):
        # Récupérer les employés du département
        emps = await db.employees.find({"department": user["department"]}, {"_id": 1}).to_list(500)
        emp_ids = [str(e["_id"]) for e in emps]
        conf_query["employee_id"] = {"$in": emp_ids}

    confirmations = await db.planning_confirmations.find(conf_query).to_list(500)
    confirmed_ids = [c["employee_id"] for c in confirmations]

    # Mon statut si employé
    my_confirmed = user["id"] in confirmed_ids

    return {
        "week": week,
        "published": published,
        "published_at": published_at,
        "confirmations": confirmed_ids,
        "my_confirmed": my_confirmed,
        "total_confirmed": len(confirmed_ids),
    }


# ── Confirmation (signature employé) ─────────────────────────────────────────

@router.post("/confirm")
async def confirm_planning(body: ConfirmBody, user: dict = Depends(get_current_user)):
    db = get_db()
    # Vérifier que le planning est publié
    dept = user.get("department", "")
    pub = await db.planning_publications.find_one({
        "week": body.week,
        "$or": [{"department": dept}, {"department": ""}]
    })
    if not pub:
        raise HTTPException(status_code=404, detail="Planning non encore publié pour cette semaine")

    existing = await db.planning_confirmations.find_one({
        "week": body.week,
        "employee_id": user["id"],
    })
    if existing:
        return {"already_confirmed": True, "confirmed_at": existing["confirmed_at"]}

    doc = {
        "_id": new_id(),
        "week": body.week,
        "employee_id": user["id"],
        "confirmed_at": now_iso(),
    }
    await db.planning_confirmations.insert_one(doc)
    await log_action("planning_confirmed", user["id"], {"week": body.week})
    return {"confirmed": True, "confirmed_at": doc["confirmed_at"]}


# ── Check-in / Check-out ──────────────────────────────────────────────────────

@router.post("/checkin")
async def checkin_shift(body: CheckinBody, user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId

    # Trouver le shift
    shift = await db.shifts.find_one({"_id": body.shift_id})
    if not shift:
        try:
            shift = await db.shifts.find_one({"_id": ObjectId(body.shift_id)})
        except Exception:
            pass
    if not shift:
        raise HTTPException(status_code=404, detail="Shift introuvable")

    # Seul l'employé concerné ou un manager peut pointer
    if shift.get("employee_id") != user["id"] and not is_director(user) and not is_department_manager(user):
        raise HTTPException(status_code=403, detail="Accès refusé")

    real_id = shift["_id"]
    ts = now_iso()

    if body.action == "checkin":
        await db.shifts.update_one({"_id": real_id}, {"$set": {"checkin_at": ts}})
        await log_action("shift_checkin", user["id"], {"shift_id": body.shift_id})
        return {"action": "checkin", "timestamp": ts}
    elif body.action == "checkout":
        if not shift.get("checkin_at"):
            raise HTTPException(status_code=400, detail="Vous n'avez pas encore pointé votre arrivée")
        await db.shifts.update_one({"_id": real_id}, {"$set": {"checkout_at": ts}})
        await log_action("shift_checkout", user["id"], {"shift_id": body.shift_id})
        return {"action": "checkout", "timestamp": ts}
    else:
        raise HTTPException(status_code=400, detail="Action invalide (checkin | checkout)")


@router.get("/presence/{date}")
async def get_presence(date: str, user: dict = Depends(get_current_user)):
    """Retourne tous les employés présents (checkés) pour une date donnée."""
    db = get_db()
    query = {"date": date, "checkin_at": {"$exists": True}}
    if is_department_manager(user):
        query["department"] = user["department"]

    shifts = await db.shifts.find(query, {"_id": 1, "employee_id": 1, "department": 1,
                                           "start_time": 1, "end_time": 1,
                                           "checkin_at": 1, "checkout_at": 1}).to_list(500)
    result = []
    for s in shifts:
        emp = await db.employees.find_one({"_id": s["employee_id"]}, {"name": 1, "department": 1})
        result.append({
            "shift_id": str(s["_id"]),
            "employee_id": s["employee_id"],
            "employee_name": emp["name"] if emp else "Inconnu",
            "department": s.get("department", ""),
            "start_time": s.get("start_time"),
            "end_time": s.get("end_time"),
            "checkin_at": s.get("checkin_at"),
            "checkout_at": s.get("checkout_at"),
            "present": bool(s.get("checkin_at") and not s.get("checkout_at")),
        })
    return result
