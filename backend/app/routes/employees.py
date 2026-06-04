from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.dependencies import get_current_user, require_manager, require_director
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, PasswordChange
from app.auth.security import hash_password, verify_password
from app.utils.permissions import can_view_employee, can_manage_employee, is_director, is_department_manager
from app.utils.audit import log_action
from app.utils.id import new_id
from app.database import get_db

router = APIRouter(prefix="/employees", tags=["employees"])


def _out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


@router.get("")
async def list_employees(user: dict = Depends(get_current_user)):
    db = get_db()
    if is_director(user):
        cursor = db.employees.find({}, {"password_hash": 0})
    elif is_department_manager(user):
        cursor = db.employees.find({"department": user["department"]}, {"password_hash": 0})
    else:
        doc = await db.employees.find_one({"_id": user["id"]}, {"password_hash": 0})
        return [_out(doc)] if doc else []
    return [_out(doc) async for doc in cursor]


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(body: EmployeeCreate, user: dict = Depends(require_manager)):
    if body.role == "director" and not is_director(user):
        raise HTTPException(status_code=403, detail="Seul le directeur peut créer un compte directeur")
    if is_department_manager(user) and body.department != user["department"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez créer des employés que dans votre département")
    db = get_db()
    existing = await db.employees.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")
    doc = body.model_dump()
    doc["_id"] = new_id()          # UUID string → find_one({"_id": id}) works correctly
    doc["email"] = doc["email"].lower()
    doc["password_hash"] = hash_password(doc.pop("password"))
    await db.employees.insert_one(doc)
    await log_action("employee_created", user["id"], {"target_email": doc["email"]})
    return _out(doc)


@router.get("/{emp_id}")
async def get_employee(emp_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.employees.find_one({"_id": emp_id}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    doc["id"] = emp_id
    doc.pop("_id", None)
    if not can_view_employee(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    return doc


@router.put("/{emp_id}")
async def update_employee(emp_id: str, body: EmployeeUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.employees.find_one({"_id": emp_id}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    doc["id"] = emp_id
    # Employees can only update their own phone/note
    if user["id"] == emp_id:
        allowed = {}
        if body.phone is not None:
            allowed["phone"] = body.phone
        if body.note is not None:
            allowed["note"] = body.note
        if not allowed:
            raise HTTPException(status_code=400, detail="Aucune modification autorisée")
        updates = allowed
    else:
        if not can_manage_employee(user, doc):
            raise HTTPException(status_code=403, detail="Accès refusé")
        if body.role == "director" and not is_director(user):
            raise HTTPException(status_code=403, detail="Seul le directeur peut attribuer le rôle directeur")
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        if "email" in updates:
            updates["email"] = updates["email"].lower()
    await db.employees.update_one({"_id": emp_id}, {"$set": updates})
    await log_action("employee_updated", user["id"], {"target_id": emp_id})
    updated = await db.employees.find_one({"_id": emp_id}, {"password_hash": 0})
    return _out(updated)


@router.delete("/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(emp_id: str, user: dict = Depends(require_manager)):
    db = get_db()
    doc = await db.employees.find_one({"_id": emp_id}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Employé introuvable")
    doc["id"] = emp_id
    if not can_manage_employee(user, doc):
        raise HTTPException(status_code=403, detail="Accès refusé")
    if emp_id == user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")
    await db.employees.delete_one({"_id": emp_id})
    await log_action("employee_deleted", user["id"], {"target_id": emp_id})


@router.post("/{emp_id}/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(emp_id: str, body: PasswordChange, user: dict = Depends(get_current_user)):
    if user["id"] != emp_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez changer que votre propre mot de passe")
    db = get_db()
    doc = await db.employees.find_one({"_id": emp_id})
    if not verify_password(body.current_password, doc.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    new_hash = hash_password(body.new_password)
    await db.employees.update_one({"_id": emp_id}, {"$set": {"password_hash": new_hash}})
    await log_action("password_changed", user["id"], {})
