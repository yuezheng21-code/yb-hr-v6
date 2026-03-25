"""
Settlement router
"""
import csv
import io
from datetime import date
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import backend.database as database
from backend.deps import get_user, rows

router = APIRouter(prefix="/api/settlement", tags=["settlement"])


@router.get("/monthly")
def monthly_settlement(month: str = "", u: dict = Depends(get_user)):
    if not month:
        month = date.today().strftime("%Y-%m")
    db = database.get_db()
    conds = [f"work_date LIKE '{month}%'"]
    if u.get("supplier_id"):
        conds.append(f"supplier_id='{u['supplier_id']}'")
    if u.get("biz_line") and u["role"] not in ("admin", "hr", "fin"):
        conds.append(f"biz_line='{u['biz_line']}'")
    sql = f"""SELECT employee_id,employee_name,warehouse_code,biz_line,source,supplier_id,
        ROUND(CAST(SUM(hours) AS NUMERIC),1) as total_hours,
        ROUND(CAST(SUM(gross_pay) AS NUMERIC),2) as gross_total,
        ROUND(CAST(SUM(ssi_deduct) AS NUMERIC),2) as ssi_total,
        ROUND(CAST(SUM(tax_deduct) AS NUMERIC),2) as tax_total,
        ROUND(CAST(SUM(net_pay) AS NUMERIC),2) as net_total,
        COUNT(*) as record_count
        FROM timesheets WHERE {' AND '.join(conds)} AND status='已入账'
        GROUP BY employee_id,warehouse_code ORDER BY employee_name"""
    result = rows(db, sql)
    summary = {
        "total_gross": sum(r["gross_total"] for r in result),
        "total_net": sum(r["net_total"] for r in result),
        "total_hours": sum(r["total_hours"] for r in result),
        "employee_count": len(result),
    }
    db.close()
    return {"month": month, "rows": result, "summary": summary}


@router.get("/monthly/export")
def export_monthly_settlement(month: str = "", u: dict = Depends(get_user)):
    """Export monthly settlement as a UTF-8 CSV download."""
    if not month:
        month = date.today().strftime("%Y-%m")
    db = database.get_db()
    conds = [f"work_date LIKE '{month}%'"]
    if u.get("supplier_id"):
        conds.append(f"supplier_id='{u['supplier_id']}'")
    if u.get("biz_line") and u["role"] not in ("admin", "hr", "fin"):
        conds.append(f"biz_line='{u['biz_line']}'")
    sql = f"""SELECT employee_id,employee_name,warehouse_code,biz_line,source,supplier_id,
        ROUND(CAST(SUM(hours) AS NUMERIC),1) as total_hours,
        ROUND(CAST(SUM(gross_pay) AS NUMERIC),2) as gross_total,
        ROUND(CAST(SUM(ssi_deduct) AS NUMERIC),2) as ssi_total,
        ROUND(CAST(SUM(tax_deduct) AS NUMERIC),2) as tax_total,
        ROUND(CAST(SUM(net_pay) AS NUMERIC),2) as net_total,
        COUNT(*) as record_count
        FROM timesheets WHERE {' AND '.join(conds)} AND status='已入账'
        GROUP BY employee_id,warehouse_code ORDER BY employee_name"""
    result = rows(db, sql)
    db.close()

    fields = ["employee_id", "employee_name", "warehouse_code", "biz_line", "source",
              "total_hours", "gross_total", "ssi_total", "tax_total", "net_total", "record_count"]
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(result)

    filename = f"settlement_{month}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
