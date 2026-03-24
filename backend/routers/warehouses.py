"""
Warehouses, suppliers, grades, KPI levels, cost calc, salary lookup router
"""
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(tags=["warehouses"])

_SUPPLIER_FIELDS = {"name", "biz_line", "contact_name", "phone", "email", "tax_handle", "rating", "status", "notes"}

# ── Warehouses ───────────────────────────────────────────────────────

@router.get("/api/warehouses")
def list_warehouses(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM warehouses WHERE active=1 ORDER BY code")
    db.close()
    return result


@router.put("/api/warehouses/{code}")
def update_warehouse(code: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    data.pop("code", None)
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE warehouses SET {sets} WHERE code=?", list(data.values()) + [code])
    database.commit(db)
    db.close()
    return {"ok": True}


@router.get("/api/warehouses/{code}/rates")
def warehouse_rates(code: str, u: dict = Depends(get_user)):
    db = database.get_db()
    wh = one(db, "SELECT * FROM warehouses WHERE code=?", (code,))
    db.close()
    if not wh:
        raise HTTPException(404)
    return dict(wh)


# ── Suppliers ────────────────────────────────────────────────────────

@router.get("/api/suppliers")
def list_suppliers(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM suppliers ORDER BY name")
    db.close()
    return result


@router.post("/api/suppliers")
def create_supplier(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr"):
        raise HTTPException(403)
    safe = {k: v for k, v in data.items() if k in _SUPPLIER_FIELDS}
    if not safe.get("name"):
        raise HTTPException(400, "name is required")
    db = database.get_db()
    existing = [r["id"] for r in rows(db, "SELECT id FROM suppliers WHERE id LIKE 'SUP-%'")]
    nums = [
        int(x.split("-")[1])
        for x in existing
        if len(x.split("-")) > 1 and x.split("-")[1].isdigit()
    ]
    sup_id = f"SUP-{max(nums, default=0) + 1:03d}"
    safe["id"] = sup_id
    cols = ",".join(safe.keys())
    phs = ",".join(["?"] * len(safe))
    database.execute(db, f"INSERT INTO suppliers({cols}) VALUES({phs})", list(safe.values()))
    auditlog(db, u, "CREATE", "suppliers", sup_id, safe.get("name", ""))
    database.commit(db)
    db.close()
    return {"id": sup_id}


@router.put("/api/suppliers/{sup_id}")
def update_supplier(sup_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr"):
        raise HTTPException(403)
    safe = {k: v for k, v in data.items() if k in _SUPPLIER_FIELDS}
    if not safe:
        raise HTTPException(400, "no valid fields to update")
    db = database.get_db()
    sets = ",".join(f"{k}=?" for k in safe)
    database.execute(db, f"UPDATE suppliers SET {sets} WHERE id=?", list(safe.values()) + [sup_id])
    auditlog(db, u, "UPDATE", "suppliers", sup_id)
    database.commit(db)
    db.close()
    return {"ok": True}


@router.delete("/api/suppliers/{sup_id}")
def deactivate_supplier(sup_id: str, u: dict = Depends(get_user)):
    if u["role"] != "admin":
        raise HTTPException(403)
    db = database.get_db()
    database.execute(db, "UPDATE suppliers SET status='停止合作' WHERE id=?", (sup_id,))
    auditlog(db, u, "DEACTIVATE", "suppliers", sup_id)
    database.commit(db)
    db.close()
    return {"ok": True}


# ── Grades / KPI ─────────────────────────────────────────────────────

@router.get("/api/grades")
def get_grades(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM grade_salaries ORDER BY grade")
    db.close()
    return result


@router.get("/api/kpi-levels")
def get_kpi(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM kpi_levels ORDER BY level")
    db.close()
    return result


# ── Cost Calc / Salary Lookup ─────────────────────────────────────────

@router.post("/api/cost-calc")
def cost_calc(data: dict = Body(...), u: dict = Depends(get_user)):
    br = float(data.get("brutto_rate", 14.0))
    wh = float(data.get("weekly_hours", 40.0))
    mh = round(wh * 4.333, 1)
    gross = round(br * mh, 2)
    ssi_emp = round(gross * 0.2065, 2)
    hol = round(gross * 0.0833, 2)
    mgmt = round(gross * 0.05, 2)
    total = round(gross + ssi_emp + hol + mgmt, 2)
    true_h = round(total / mh, 2) if mh > 0 else 0
    is_mj = data.get("emp_type") == "Minijob" or gross <= 538
    e_ssi = round(gross * 0.205, 2) if not is_mj else 0
    e_tax = round(gross * 0.08, 2) if not is_mj else 0
    return {
        "brutto_rate": br,
        "weekly_hours": wh,
        "monthly_hours": mh,
        "gross_monthly": gross,
        "employer_ssi": ssi_emp,
        "holiday_provision": hol,
        "mgmt_cost": mgmt,
        "total_employer_cost": total,
        "true_hourly_cost": true_h,
        "employee_ssi": e_ssi,
        "income_tax": e_tax,
        "net_pay": round(gross - e_ssi - e_tax, 2),
        "is_minijob": is_mj,
    }


@router.get("/api/salary-lookup")
def salary_lookup(
    employee_id: str,
    warehouse_code: str,
    shift: str = "白班",
    hours: float = 8.0,
    u: dict = Depends(get_user),
):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (employee_id,))
    if not emp:
        raise HTTPException(404)
    pay = database.calc_timesheet_pay(db, dict(emp), warehouse_code, shift, hours)
    wh = one(db, "SELECT name FROM warehouses WHERE code=?", (warehouse_code,))
    db.close()
    return {**pay, "employee_name": emp["name"], "warehouse_name": wh["name"] if wh else warehouse_code}
