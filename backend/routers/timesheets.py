"""
Timesheets router
"""
import uuid
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(prefix="/api/timesheets", tags=["timesheets"])


@router.get("")
def list_timesheets(
    u: dict = Depends(get_user),
    date_from: str = "",
    date_to: str = "",
    status: str = "",
    warehouse: str = "",
    employee_id: str = "",
):
    db = database.get_db()
    conds = ["1=1"]
    params = []
    if u.get("supplier_id"):
        conds.append("supplier_id=?")
        params.append(u["supplier_id"])
    if u.get("warehouse_code") and u["role"] == "wh":
        conds.append("warehouse_code=?")
        params.append(u["warehouse_code"])
    if u.get("biz_line") and u["role"] not in ("admin", "hr", "fin"):
        conds.append("biz_line=?")
        params.append(u["biz_line"])
    if u.get("_emp_id"):
        conds.append("employee_id=?")
        params.append(u["_emp_id"])
    if date_from:
        conds.append("work_date>=?")
        params.append(date_from)
    if date_to:
        conds.append("work_date<=?")
        params.append(date_to)
    if status:
        conds.append("status=?")
        params.append(status)
    if warehouse:
        conds.append("warehouse_code=?")
        params.append(warehouse)
    if employee_id:
        conds.append("employee_id=?")
        params.append(employee_id)
    result = rows(
        db,
        f"SELECT * FROM timesheets WHERE {' AND '.join(conds)} ORDER BY work_date DESC,id DESC LIMIT 500",
        params,
    )
    db.close()
    return result


@router.post("")
def create_timesheet(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (data.get("employee_id", ""),))
    if not emp:
        raise HTTPException(404, "员工不存在")
    sh = int(data.get("start_time", "08:00").split(":")[0])
    eh = int(data.get("end_time", "16:00").split(":")[0])
    hrs = max(0, eh - sh)
    wh_code = data.get("warehouse_code") or emp["warehouse_code"]
    shift = data.get("shift", "白班")
    pay = database.calc_timesheet_pay(db, dict(emp), wh_code, shift, hrs)
    ts_id = f"WT-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    database.execute(
        db,
        """INSERT INTO timesheets(id,employee_id,employee_name,source,supplier_id,biz_line,
        work_date,warehouse_code,shift,start_time,end_time,hours,position,settlement_type,grade,
        base_rate,shift_bonus,effective_rate,gross_pay,perf_bonus,ssi_deduct,tax_deduct,net_pay,status)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            ts_id,
            emp["id"],
            emp["name"],
            emp["source"],
            emp["supplier_id"],
            emp["biz_line"],
            data.get("work_date", str(date.today())),
            wh_code,
            shift,
            data.get("start_time", "08:00"),
            data.get("end_time", "16:00"),
            hrs,
            emp["position"],
            emp["settlement_type"],
            emp["grade"],
            pay["base_rate"],
            pay["shift_bonus"],
            pay["effective_rate"],
            pay["gross_pay"],
            pay["perf_bonus"],
            pay["ssi_deduct"],
            pay["tax_deduct"],
            pay["net_pay"],
            "待仓库审批",
        ),
    )
    overtime = max(0, hrs - float(emp.get("contract_hours") or 8))
    if overtime > 0:
        database.execute(
            db,
            "UPDATE zeitkonto SET plus_hours=ROUND(CAST(plus_hours+? AS NUMERIC),1) WHERE employee_id=?",
            (overtime, emp["id"]),
        )
    auditlog(db, u, "CREATE", "timesheets", ts_id, f"{emp['name']} {hrs}h")
    database.commit(db)
    db.close()
    return {"id": ts_id, "hours": hrs, "gross_pay": pay["gross_pay"]}


def _approve_one(ts_id: str, u: dict):
    """Shared approval logic used by single and batch approve."""
    db = database.get_db()
    ts = one(db, "SELECT * FROM timesheets WHERE id=?", (ts_id,))
    if not ts:
        raise HTTPException(404)
    now = datetime.now().isoformat()
    if ts["status"] == "待仓库审批" and u["role"] in ("admin", "wh", "mgr"):
        database.execute(
            db,
            "UPDATE timesheets SET status='待财务确认',wh_approver=?,wh_approved_at=? WHERE id=?",
            (u["display_name"], now, ts_id),
        )
    elif ts["status"] == "待财务确认" and u["role"] in ("admin", "fin"):
        database.execute(
            db,
            "UPDATE timesheets SET status='已入账',fin_approver=?,fin_approved_at=? WHERE id=?",
            (u["display_name"], now, ts_id),
        )
    else:
        raise HTTPException(400, "状态错误或无权限")
    auditlog(db, u, "APPROVE", "timesheets", ts_id)
    database.commit(db)
    db.close()
    return {"ok": True}


@router.put("/batch-approve")
def batch_approve(data: dict = Body(...), u: dict = Depends(get_user)):
    for ts_id in data.get("ids", []):
        try:
            _approve_one(ts_id, u)
        except Exception:
            pass
    return {"ok": True}


@router.put("/{ts_id}/approve")
def approve_timesheet(ts_id: str, u: dict = Depends(get_user)):
    return _approve_one(ts_id, u)
