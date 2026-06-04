from datetime import datetime, timezone
from app.database import get_db


async def log_action(action: str, user_id: str, details: dict = None):
    db = get_db()
    await db.audit_logs.insert_one({
        "action": action,
        "user_id": user_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc),
    })
