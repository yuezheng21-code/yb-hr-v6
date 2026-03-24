"""
Analytics / Dashboard router
"""
from fastapi import APIRouter, Depends
import backend.database as database
from backend.deps import get_user, rows, one

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard(u: dict = Depends(get_user)):
    db = database.get_db()
    wf = f"AND warehouse_code='{u['warehouse_code']}'" if u.get("warehouse_code") else ""
    bf = (
        f"AND biz_line='{u['biz_line']}'"
        if u.get("biz_line") and u["role"] not in ("admin", "hr", "fin")
        else ""
    )
    sf = f"AND supplier_id='{u['supplier_id']}'" if u.get("supplier_id") else ""

    emp_count = one(db, f"SELECT COUNT(*) as c FROM employees WHERE status='在职' {bf} {sf}")["c"]
    ts_pending = one(
        db,
        f"SELECT COUNT(*) as c FROM timesheets WHERE status IN ('待仓库审批','待财务确认') {wf}",
    )["c"]
    ts_hrs = one(
        db,
        f"SELECT COALESCE(SUM(hours),0) as h FROM timesheets {('WHERE ' + wf.strip('AND ')) if wf else ''}",
    )["h"]
    abm_active = one(db, "SELECT COUNT(*) as c FROM abmahnungen WHERE status='有效'")["c"]
    zk_alerts = one(db, "SELECT COUNT(*) as c FROM zeitkonto WHERE plus_hours > 150")["c"]
    wv_active = one(db, "SELECT COUNT(*) as c FROM wv_projects WHERE closed=0")["c"]
    daily = rows(
        db,
        (
            f"SELECT work_date, ROUND(SUM(hours),1) as total_hours FROM timesheets "
            f"WHERE work_date >= CURRENT_DATE - INTERVAL '7 days' {bf} {sf} "
            f"GROUP BY work_date ORDER BY work_date"
        )
        if database.DATABASE_URL
        else (
            f"SELECT work_date, ROUND(SUM(hours),1) as total_hours FROM timesheets "
            f"WHERE work_date >= date('now','-7 days') {bf} {sf} "
            f"GROUP BY work_date ORDER BY work_date"
        ),
    )
    db.close()
    return {
        "employee_count": emp_count,
        "ts_pending": ts_pending,
        "ts_total_hours": round(float(ts_hrs), 1),
        "abmahnung_active": abm_active,
        "zeitkonto_alerts": zk_alerts,
        "wv_active_projects": wv_active,
        "daily_hours": daily,
    }
