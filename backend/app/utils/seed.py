"""
Run with: python -m app.utils.seed
Clears all collections and inserts realistic demo data.
"""
import asyncio
import sys
import os
from datetime import date, timedelta
from pathlib import Path

# Make sure project root is on path when run directly
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.auth.security import hash_password

DEPARTMENTS = [
    "Caisse", "Fruits et légumes", "Viande", "Boulangerie",
    "Épicerie", "Produits laitiers", "Réception", "Administration",
]

EMPLOYEES = [
    # id, name, email, password, role, department
    ("emp-01", "Younes Kamouly",    "directeur@smartshift.fr",  "directeur123",  "director",          "Administration"),
    ("emp-02", "Makenson Pierre",   "adjoint@smartshift.fr",    "adjoint123",    "assistant_manager", "Caisse"),
    ("emp-03", "Fabrice Dumont",    "adjoint2@smartshift.fr",   "adjoint123",    "assistant_manager", "Administration"),
    ("emp-04", "Sara Benali",       "gerant@smartshift.fr",     "gerant123",     "manager",           "Fruits et légumes"),
    ("emp-05", "Karim Mansouri",    "employe@smartshift.fr",    "employe123",    "employee",          "Épicerie"),
    ("emp-06", "Amina Diallo",      "amina@smartshift.fr",      "pass1234",      "employee",          "Caisse"),
    ("emp-07", "Lucas Moreau",      "lucas@smartshift.fr",      "pass1234",      "employee",          "Caisse"),
    ("emp-08", "Fatou Sy",          "fatou@smartshift.fr",      "pass1234",      "employee",          "Fruits et légumes"),
    ("emp-09", "Pierre Leclerc",    "pierre@smartshift.fr",     "pass1234",      "employee",          "Viande"),
    ("emp-10", "Nadia Ouali",       "nadia@smartshift.fr",      "pass1234",      "employee",          "Boulangerie"),
    ("emp-11", "Thomas Bernard",    "thomas@smartshift.fr",     "pass1234",      "employee",          "Épicerie"),
    ("emp-12", "Céline Dupont",     "celine@smartshift.fr",     "pass1234",      "employee",          "Produits laitiers"),
    ("emp-13", "Youssef Hamidi",    "youssef@smartshift.fr",    "pass1234",      "employee",          "Réception"),
    ("emp-14", "Marie Fontaine",    "marie@smartshift.fr",      "pass1234",      "employee",          "Caisse"),
    ("emp-15", "Antoine Garnier",   "antoine@smartshift.fr",    "pass1234",      "employee",          "Viande"),
    ("emp-16", "Léa Rousseau",      "lea@smartshift.fr",        "pass1234",      "employee",          "Boulangerie"),
    ("emp-17", "Hamid Benali",      "hamid@smartshift.fr",      "pass1234",      "employee",          "Épicerie"),
    ("emp-18", "Clara Martin",      "clara@smartshift.fr",      "pass1234",      "employee",          "Produits laitiers"),
    ("emp-19", "Kevin Petit",       "kevin@smartshift.fr",      "pass1234",      "employee",          "Réception"),
    ("emp-20", "Sonia Traore",      "sonia@smartshift.fr",      "pass1234",      "employee",          "Administration"),
]


def week_dates(offset_weeks: int = 0):
    today = date.today()
    monday = today - timedelta(days=today.weekday()) + timedelta(weeks=offset_weeks)
    return [(monday + timedelta(days=i)).isoformat() for i in range(7)]


def shift(sid, emp_id, dept, d, start, end, status="planned", note=None):
    doc = {
        "_id": sid,
        "employee_id": emp_id,
        "department": dept,
        "date": d,
        "start_time": start,
        "end_time": end,
        "status": status,
    }
    if note:
        doc["note"] = note
    return doc


async def seed():
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client.get_default_database()

    print("Dropping collections...")
    for col in ["employees", "shifts", "absences", "replacements", "availabilities", "audit_logs"]:
        await db.drop_collection(col)

    print("Inserting employees...")
    emp_docs = []
    for eid, name, email, password, role, dept in EMPLOYEES:
        emp_docs.append({
            "_id": eid,
            "name": name,
            "email": email.lower(),
            "password_hash": hash_password(password),
            "role": role,
            "department": dept,
            "phone": None,
            "note": None,
        })
    await db.employees.insert_many(emp_docs)
    await db.employees.create_index("email", unique=True)

    this_week = week_dates(0)
    last_week = week_dates(-1)

    print("Inserting shifts...")
    shifts = [
        # This week — Caisse
        shift("sh-01", "emp-06", "Caisse",          this_week[0], "08:00", "16:00"),
        shift("sh-02", "emp-07", "Caisse",          this_week[0], "14:00", "20:00"),
        shift("sh-03", "emp-14", "Caisse",          this_week[1], "08:00", "16:00"),
        shift("sh-04", "emp-06", "Caisse",          this_week[2], "08:00", "16:00"),
        shift("sh-05", "emp-07", "Caisse",          this_week[2], "14:00", "20:00"),
        # Fruits et légumes
        shift("sh-06", "emp-08", "Fruits et légumes", this_week[0], "07:00", "15:00"),
        shift("sh-07", "emp-08", "Fruits et légumes", this_week[1], "07:00", "15:00"),
        shift("sh-08", "emp-08", "Fruits et légumes", this_week[3], "07:00", "15:00"),
        # Viande
        shift("sh-09", "emp-09", "Viande",          this_week[0], "06:00", "14:00"),
        shift("sh-10", "emp-15", "Viande",          this_week[0], "14:00", "20:00"),
        shift("sh-11", "emp-09", "Viande",          this_week[2], "06:00", "14:00", "absent"),
        # Boulangerie
        shift("sh-12", "emp-10", "Boulangerie",     this_week[0], "05:00", "13:00"),
        shift("sh-13", "emp-16", "Boulangerie",     this_week[0], "05:00", "13:00"),
        shift("sh-14", "emp-10", "Boulangerie",     this_week[1], "05:00", "13:00"),
        # Épicerie
        shift("sh-15", "emp-05", "Épicerie",        this_week[0], "09:00", "17:00"),
        shift("sh-16", "emp-11", "Épicerie",        this_week[0], "13:00", "20:00"),
        shift("sh-17", "emp-17", "Épicerie",        this_week[1], "09:00", "17:00"),
        shift("sh-18", "emp-05", "Épicerie",        this_week[2], "09:00", "17:00"),
        # Produits laitiers
        shift("sh-19", "emp-12", "Produits laitiers", this_week[0], "08:00", "16:00"),
        shift("sh-20", "emp-18", "Produits laitiers", this_week[1], "08:00", "16:00"),
        # Réception
        shift("sh-21", "emp-13", "Réception",       this_week[0], "07:00", "15:00"),
        shift("sh-22", "emp-19", "Réception",       this_week[2], "07:00", "15:00"),
        # Last week (historical)
        shift("sh-30", "emp-06", "Caisse",          last_week[0], "08:00", "16:00", "completed"),
        shift("sh-31", "emp-07", "Caisse",          last_week[1], "14:00", "20:00", "completed"),
        shift("sh-32", "emp-08", "Fruits et légumes", last_week[0], "07:00", "15:00", "completed"),
        shift("sh-33", "emp-09", "Viande",          last_week[0], "06:00", "14:00", "completed"),
        shift("sh-34", "emp-10", "Boulangerie",     last_week[0], "05:00", "13:00", "completed"),
    ]
    await db.shifts.insert_many(shifts)
    await db.shifts.create_index([("employee_id", 1), ("date", 1)])

    print("Inserting absences...")
    absences = [
        {
            "_id": "ab-01",
            "employee_id": "emp-09",
            "department": "Viande",
            "date": this_week[2],
            "reason": "Maladie",
            "urgency": "high",
            "comment": "Grippe, certificat médical fourni",
            "status": "accepted",
        },
        {
            "_id": "ab-02",
            "employee_id": "emp-10",
            "department": "Boulangerie",
            "date": this_week[3],
            "reason": "Rendez-vous médical",
            "urgency": "medium",
            "comment": "",
            "status": "pending",
        },
        {
            "_id": "ab-03",
            "employee_id": "emp-05",
            "department": "Épicerie",
            "date": this_week[4],
            "reason": "Congé personnel",
            "urgency": "low",
            "comment": "",
            "status": "pending",
        },
        {
            "_id": "ab-04",
            "employee_id": "emp-06",
            "department": "Caisse",
            "date": last_week[4],
            "reason": "Congé payé",
            "urgency": "low",
            "comment": "",
            "status": "accepted",
        },
        {
            "_id": "ab-05",
            "employee_id": "emp-14",
            "department": "Caisse",
            "date": this_week[1],
            "reason": "Urgence familiale",
            "urgency": "high",
            "comment": "Situation familiale grave",
            "status": "refused",
        },
    ]
    await db.absences.insert_many(absences)

    print("Inserting replacements...")
    replacements = [
        {
            "_id": "rp-01",
            "absence_id": "ab-01",
            "original_employee_id": "emp-09",
            "replacement_employee_id": "emp-15",
            "department": "Viande",
            "date": this_week[2],
            "start_time": "06:00",
            "end_time": "14:00",
            "status": "assigned",
        },
        {
            "_id": "rp-02",
            "absence_id": "ab-02",
            "original_employee_id": "emp-10",
            "replacement_employee_id": None,
            "department": "Boulangerie",
            "date": this_week[3],
            "start_time": "05:00",
            "end_time": "13:00",
            "status": "open",
        },
    ]
    await db.replacements.insert_many(replacements)

    print("Inserting availabilities...")
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    avail_docs = []
    avail_id = 1
    schedules = {
        "emp-05": ["available", "available", "available", "available", "available", "unavailable", "unavailable"],
        "emp-06": ["available", "available", "unavailable", "available", "available", "partial", "unavailable"],
        "emp-07": ["partial", "available", "available", "available", "unavailable", "available", "unavailable"],
        "emp-08": ["available", "available", "available", "partial", "available", "unavailable", "unavailable"],
        "emp-09": ["available", "available", "unavailable", "available", "available", "available", "unavailable"],
        "emp-10": ["available", "available", "available", "unavailable", "available", "available", "unavailable"],
    }
    for emp_id, types in schedules.items():
        for day, typ in zip(days, types):
            avail_docs.append({
                "_id": f"av-{avail_id:02d}",
                "employee_id": emp_id,
                "day": day,
                "type": typ,
                "note": None,
            })
            avail_id += 1
    await db.availabilities.insert_many(avail_docs)
    await db.availabilities.create_index([("employee_id", 1), ("day", 1)], unique=True)

    print("Seed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
