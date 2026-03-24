"""
Employees router
"""
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("")
def list_employees(
    u: dict = Depends(get_user),
    search: str = "",
    status: str = "",
    warehouse: str = "",
    biz: str = "",
    source: str = "",
):
    db = database.get_db()
    conds = ["1=1"]
    params = []
    if u.get("supplier_id"):
        conds.append("supplier_id=?")
        params.append(u["supplier_id"])
    if u.get("biz_line") and u["role"] not in ("admin", "hr", "fin"):
        conds.append("biz_line=?")
        params.append(u["biz_line"])
    if u.get("warehouse_code") and u["role"] == "wh":
        conds.append("warehouse_code=?")
        params.append(u["warehouse_code"])
    if search:
        conds.append("(name LIKE ? OR id LIKE ? OR phone LIKE ?)")
        params += [f"%{search}%"] * 3
    if status:
        conds.append("status=?")
        params.append(status)
    if warehouse:
        conds.append("warehouse_code=?")
        params.append(warehouse)
    if biz:
        conds.append("biz_line=?")
        params.append(biz)
    if source:
        conds.append("source=?")
        params.append(source)
    result = rows(db, f"SELECT * FROM employees WHERE {' AND '.join(conds)} ORDER BY id", params)
    db.close()
    return result


@router.post("")
def create_employee(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    biz = data.get("biz_line", "渊博")
    prefix = "YB" if biz == "渊博" else "W5"
    existing = [r["id"] for r in rows(db, f"SELECT id FROM employees WHERE id LIKE '{prefix}-%'")]
    nums = [
        int(x.split("-")[1])
        for x in existing
        if len(x.split("-")) > 1 and x.split("-")[1].isdigit()
    ]
    emp_id = f"{prefix}-{max(nums, default=0) + 1:03d}"
    data["id"] = emp_id
    cols = ",".join(data.keys())
    phs = ",".join(["?"] * len(data))
    database.execute(db, f"INSERT INTO employees({cols}) VALUES({phs})", list(data.values()))
    database.execute(
        db,
        (
            "INSERT INTO zeitkonto(employee_id,employee_name) VALUES(?,?) ON CONFLICT(employee_id) DO NOTHING"
            if database.DATABASE_URL
            else "INSERT OR IGNORE INTO zeitkonto(employee_id,employee_name) VALUES(?,?)"
        ),
        (emp_id, data.get("name", "")),
    )
    auditlog(db, u, "CREATE", "employees", emp_id, data.get("name", ""))
    database.commit(db)
    db.close()
    return {"id": emp_id}


@router.put("/{emp_id}")
def update_employee(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    data.pop("id", None)
    db = database.get_db()
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE employees SET {sets} WHERE id=?", list(data.values()) + [emp_id])
    auditlog(db, u, "UPDATE", "employees", emp_id)
    database.commit(db)
    db.close()
    return {"ok": True}


@router.delete("/{emp_id}")
def delete_employee(emp_id: str, u: dict = Depends(get_user)):
    if u["role"] != "admin":
        raise HTTPException(403)
    db = database.get_db()
    database.execute(db, "UPDATE employees SET status='离职' WHERE id=?", (emp_id,))
    auditlog(db, u, "DEACTIVATE", "employees", emp_id)
    database.commit(db)
    db.close()
    return {"ok": True}
