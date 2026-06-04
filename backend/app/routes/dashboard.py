from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user, require_manager
from app.utils.permissions import is_director, is_department_manager
from app.database import get_db
from datetime import date, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(user: dict = Depends(require_manager)):
    db = get_db()
    today = date.today().isoformat()
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    week_end = (date.today() + timedelta(days=6 - date.today().weekday())).isoformat()

    dept_filter = {} if is_director(user) else {"department": user["department"]}

    total_employees = await db.employees.count_documents({**dept_filter, "role": {"$ne": "director"}})
    shifts_this_week = await db.shifts.count_documents({**dept_filter, "date": {"$gte": week_start, "$lte": week_end}})
    pending_absences = await db.absences.count_documents({**dept_filter, "status": "pending"})
    open_replacements = await db.replacements.count_documents({**dept_filter, "status": "open"})

    # Department breakdown (director only)
    dept_stats = []
    if is_director(user):
        departments = await db.employees.distinct("department")
        for dept in departments:
            count = await db.employees.count_documents({"department": dept, "role": {"$ne": "director"}})
            dept_shifts = await db.shifts.count_documents({"department": dept, "date": {"$gte": week_start, "$lte": week_end}})
            dept_stats.append({"department": dept, "employees": count, "shifts": dept_shifts})

    return {
        "total_employees": total_employees,
        "shifts_this_week": shifts_this_week,
        "pending_absences": pending_absences,
        "open_replacements": open_replacements,
        "dept_stats": dept_stats,
    }
