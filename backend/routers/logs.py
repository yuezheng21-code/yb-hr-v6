"""
Audit logs router
"""
from fastapi import APIRouter, HTTPException, Depends
import backend.database as database
from backend.deps import get_user, rows

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("")
def get_logs(u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr"):
        raise HTTPException(403)
    db = database.get_db()
    result = rows(db, "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500")
    db.close()
    return result
