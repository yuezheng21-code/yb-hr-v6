"""
Abmahnung router
"""
import uuid
from datetime import date, datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(prefix="/api/abmahnungen", tags=["abmahnung"])


@router.get("")
def list_abmahnungen(u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    result = rows(db, "SELECT * FROM abmahnungen ORDER BY issued_date DESC")
    emp_counts = {}
    for a in result:
        if a["status"] == "有效":
            emp_counts[a["employee_id"]] = emp_counts.get(a["employee_id"], 0) + 1
    for a in result:
        a["_valid_count"] = emp_counts.get(a["employee_id"], 0)
    db.close()
    return result


@router.post("")
def create_abmahnung(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (data.get("employee_id", ""),))
    if not emp:
        raise HTTPException(404)
    issued = data.get("issued_date", str(date.today()))
    expiry = str((datetime.strptime(issued, "%Y-%m-%d") + timedelta(days=730)).date())
    abm_id = f"ABM-{emp['id']}-{date.today().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    database.execute(
        db,
        """INSERT INTO abmahnungen(id,employee_id,employee_name,abmahnung_type,incident_date,
        issued_date,issued_by,incident_description,internal_notes,status,expiry_date,delivery_method)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            abm_id,
            emp["id"],
            emp["name"],
            data.get("abmahnung_type", "旷工"),
            data.get("incident_date", issued),
            issued,
            data.get("issued_by", u["display_name"]),
            data.get("incident_description", ""),
            data.get("internal_notes", ""),
            "有效",
            expiry,
            data.get("delivery_method", "面交"),
        ),
    )
    auditlog(db, u, "CREATE_ABM", "abmahnungen", abm_id)
    database.commit(db)
    db.close()
    return {"id": abm_id, "expiry_date": expiry}


@router.put("/{abm_id}/revoke")
def revoke_abmahnung(abm_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr"):
        raise HTTPException(403)
    db = database.get_db()
    database.execute(
        db,
        "UPDATE abmahnungen SET status='已撤销',revoked_at=?,revoked_by=?,revoke_reason=? WHERE id=?",
        (datetime.now().isoformat(), u["display_name"], data.get("reason", ""), abm_id),
    )
    database.commit(db)
    db.close()
    return {"ok": True}
