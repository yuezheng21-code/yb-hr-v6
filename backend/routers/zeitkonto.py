"""
Zeitkonto router
"""
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(prefix="/api/zeitkonto", tags=["zeitkonto"])


@router.get("")
def list_zeitkonto(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(
        db,
        """SELECT z.*, e.warehouse_code, e.position, e.grade, e.biz_line,
        (SELECT COALESCE(MAX(hours),0) FROM timesheets t WHERE t.employee_id=z.employee_id) as daily_max
        FROM zeitkonto z LEFT JOIN employees e ON e.id=z.employee_id
        WHERE e.status='在职' ORDER BY z.plus_hours DESC""",
    )
    db.close()
    return result


@router.post("/{emp_id}/log")
def add_zk_log(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    hrs = float(data.get("hours", 0))
    entry_type = data.get("entry_type", "plus")
    database.execute(
        db,
        "INSERT INTO zeitkonto_logs(employee_id,log_date,entry_type,hours,reason,approved_by) VALUES(?,?,?,?,?,?)",
        (emp_id, data.get("log_date", str(date.today())), entry_type, hrs, data.get("reason", ""), u["display_name"]),
    )
    col = "plus_hours" if entry_type == "plus" else "minus_hours"
    database.execute(
        db,
        f"UPDATE zeitkonto SET {col}=ROUND(CAST({col}+? AS NUMERIC),1) WHERE employee_id=?",
        (hrs, emp_id),
    )
    auditlog(db, u, "ZK_LOG", "zeitkonto", emp_id, f"{entry_type} {hrs}h")
    database.commit(db)
    db.close()
    return {"ok": True}


@router.get("/{emp_id}/logs")
def get_zk_logs(emp_id: str, u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(
        db,
        "SELECT * FROM zeitkonto_logs WHERE employee_id=? ORDER BY created_at DESC LIMIT 100",
        (emp_id,),
    )
    db.close()
    return result


@router.put("/{emp_id}/freizeitausgleich")
def freizeitausgleich(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    hrs = float(data.get("hours", 0))
    db = database.get_db()
    database.execute(
        db,
        (
            "UPDATE zeitkonto SET plus_hours=GREATEST(0,ROUND(CAST(plus_hours-? AS NUMERIC),1)) WHERE employee_id=?"
            if database.DATABASE_URL
            else "UPDATE zeitkonto SET plus_hours=MAX(0,ROUND(CAST(plus_hours-? AS NUMERIC),1)) WHERE employee_id=?"
        ),
        (hrs, emp_id),
    )
    database.execute(
        db,
        "INSERT INTO zeitkonto_logs(employee_id,log_date,entry_type,hours,reason,approved_by) VALUES(?,?,?,?,?,?)",
        (emp_id, str(date.today()), "freizeitausgleich", hrs, "Freizeitausgleich", u["display_name"]),
    )
    database.commit(db)
    db.close()
    return {"ok": True}
