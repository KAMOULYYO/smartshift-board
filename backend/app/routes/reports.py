from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from app.auth.dependencies import require_director
from app.database import get_db
from datetime import date, timedelta

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
async def get_report_summary(
    week_start: str = Query(None),
    user: dict = Depends(require_director),
):
    db = get_db()
    if not week_start:
        today = date.today()
        week_start = (today - timedelta(days=today.weekday())).isoformat()
    try:
        start = date.fromisoformat(week_start)
    except ValueError:
        start = date.today() - timedelta(days=date.today().weekday())
    end = start + timedelta(days=6)
    week_end = end.isoformat()

    employees = await db.employees.find({}, {"password_hash": 0}).to_list(None)
    shifts = await db.shifts.find({"date": {"$gte": week_start, "$lte": week_end}}).to_list(None)
    absences = await db.absences.find({"date": {"$gte": week_start, "$lte": week_end}}).to_list(None)
    replacements = await db.replacements.find({"date": {"$gte": week_start, "$lte": week_end}}).to_list(None)

    # Hours per employee
    def calc_hours(s: str, e: str) -> float:
        try:
            sh, sm = map(int, s.split(":"))
            eh, em = map(int, e.split(":"))
            return max(0, (eh * 60 + em - sh * 60 - sm) / 60)
        except Exception:
            return 0.0

    emp_hours: dict[str, float] = {}
    for shift in shifts:
        eid = shift["employee_id"]
        emp_hours[eid] = emp_hours.get(eid, 0) + calc_hours(
            shift.get("start_time", ""), shift.get("end_time", "")
        )

    emp_map = {str(e["_id"]): e for e in employees}

    lines = [
        f"RAPPORT SMARTSHIFT BOARD",
        f"Semaine du {week_start} au {week_end}",
        f"Généré le {date.today().isoformat()}",
        "=" * 50,
        f"Effectif total : {len([e for e in employees if e.get('role') != 'director'])} employés",
        f"Shifts planifiés : {len(shifts)}",
        f"Absences : {len(absences)}",
        f"Remplacements : {len(replacements)}",
        "",
        "HEURES PAR EMPLOYÉ",
        "-" * 30,
    ]
    for eid, hours in sorted(emp_hours.items(), key=lambda x: -x[1]):
        emp = emp_map.get(eid, {})
        lines.append(f"  {emp.get('name', eid)} ({emp.get('department', '?')}) : {hours:.1f}h")

    lines += ["", "ABSENCES", "-" * 30]
    for ab in absences:
        emp = emp_map.get(ab["employee_id"], {})
        lines.append(f"  {ab['date']} - {emp.get('name', ab['employee_id'])} : {ab['reason']} [{ab['status']}]")

    return {
        "week_start": week_start,
        "week_end": week_end,
        "total_employees": len([e for e in employees if e.get("role") != "director"]),
        "total_shifts": len(shifts),
        "total_absences": len(absences),
        "total_replacements": len(replacements),
        "employee_hours": [
            {"employee_id": eid, "name": emp_map.get(eid, {}).get("name", ""), "hours": h}
            for eid, h in emp_hours.items()
        ],
        "text_report": "\n".join(lines),
    }
