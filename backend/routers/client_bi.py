"""
渊博579 HR V7 — 甲方（仓库方）运营看板
/api/v1/client-bi

给仓库方（甲方）看的只读 BI：作业量、工时、效率、质量、装卸柜、预估结算额。
数据边界：
  · role=client 只能看 users.client_warehouses 中的仓库（后端强制，见 middleware/auth.py）
  · 仅统计已确认的作业记录（待确认的只给出条数）
  · 不返回员工姓名/工号、工资与计件单价、供应商及成本、扣款等内部信息，只给汇总
admin / hr / mgr 可选择任意仓库预览甲方看到的内容。
"""
from __future__ import annotations
import csv
import io
import json
from collections import defaultdict
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.warehouse import Warehouse
from backend.models.container import ContainerRecord
from backend.models.operation import OperationLog, QualityEvent
from backend.services.performance import compute_performance
from backend.services.settlement_calc import compute_hours

router = APIRouter(prefix="/api/v1/client-bi", tags=["client-bi"])

PREVIEW_ROLES = {"admin", "hr", "mgr"}
MAX_RANGE_DAYS = 366
EVENT_LABELS = {
    "mispick": "错拣", "damage": "破损", "missing_scan": "漏扫", "label_error": "贴错标",
    "safety": "安全", "absence": "缺勤/迟到", "complaint": "投诉", "praise": "表扬",
}


def _allowed_warehouses(user: User, db: Session) -> list[str]:
    if user.role == "client":
        return [c.strip().upper() for c in (user.client_warehouses or "").split(",") if c.strip()]
    if user.role in PREVIEW_ROLES:
        return [w for (w,) in db.execute(select(Warehouse.code).order_by(Warehouse.code)).all()]
    raise HTTPException(403, "Forbidden")


def _scope(user: User, db: Session, warehouse: Optional[str]) -> list[str]:
    allowed = _allowed_warehouses(user, db)
    if not allowed:
        raise HTTPException(403, "账号未绑定任何仓库，请联系服务方开通")
    if warehouse:
        if warehouse.upper() not in allowed:
            raise HTTPException(403, "无权查看该仓库")
        return [warehouse.upper()]
    if user.role == "client":
        return allowed
    raise HTTPException(400, "请选择仓库")


def _range(date_from: Optional[str], date_to: Optional[str]) -> tuple[date, date]:
    today = date.today()
    try:
        dt = date.fromisoformat(date_to) if date_to else today
        df = date.fromisoformat(date_from) if date_from else dt - timedelta(days=29)
    except ValueError:
        raise HTTPException(400, "日期格式错误")
    if df > dt:
        raise HTTPException(400, "开始日期晚于结束日期")
    if (dt - df).days > MAX_RANGE_DAYS:
        raise HTTPException(400, "查询范围最多一年")
    return df, dt


def _public_row(r: dict) -> dict:
    """Strip internal fields (pay, deductions, supplier/employee ids) from a performance row."""
    return {k: r.get(k) for k in (
        "key", "label", "code", "unit", "standard_uph", "headcount", "days", "records", "qty", "error_qty",
        "error_rate", "total_hours", "uph", "efficiency", "quality_events", "quality_score", "client_amount",
    ) if k in r}


@router.get("/warehouses")
def my_warehouses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    codes = _allowed_warehouses(user, db)
    names = {w.code: w.name for w in db.scalars(select(Warehouse).where(Warehouse.code.in_(codes or [""]))).all()}
    return [{"code": c, "name": names.get(c, c)} for c in codes]


def _build(user: User, db: Session, warehouse: Optional[str], date_from: Optional[str], date_to: Optional[str]) -> dict:
    whs = _scope(user, db, warehouse)
    df, dt = _range(date_from, date_to)
    common = dict(warehouse_code=whs, confirmed_only=True)

    by_day = compute_performance(db, df, dt, group_by="date", **common)
    by_op = compute_performance(db, df, dt, group_by="op_type", **common)
    by_client = compute_performance(db, df, dt, group_by="client", **common)
    total = compute_performance(db, df, dt, group_by="warehouse", **common)

    # Daily series covering every day in range (zero-filled) so the trend has no gaps
    day_map = {r["key"]: r for r in by_day}
    daily = []
    d = df
    while d <= dt:
        r = day_map.get(str(d), {})
        daily.append({"date": str(d), "hours": r.get("total_hours", 0.0), "headcount": r.get("headcount", 0),
                      "efficiency": r.get("efficiency"), "records": r.get("records", 0)})
        d += timedelta(days=1)

    log_filter = (OperationLog.work_date >= df, OperationLog.work_date <= dt, OperationLog.warehouse_code.in_(whs))
    headcount = db.scalar(select(func.count(func.distinct(OperationLog.employee_id))).where(
        *log_filter, OperationLog.status == "confirmed")) or 0
    pending = db.scalar(select(func.count(OperationLog.id)).where(
        *log_filter, OperationLog.status.in_(["pending", "unmatched"]))) or 0

    # Containers (approved only)
    containers = db.scalars(select(ContainerRecord).where(
        ContainerRecord.work_date >= df, ContainerRecord.work_date <= dt, ContainerRecord.warehouse_code.in_(whs),
        ContainerRecord.approval_status.in_(["wh_approved", "fin_approved"]))).all()
    cnt: dict = defaultdict(lambda: {"count": 0, "minutes": 0.0, "timed": 0, "workers": 0})
    for c in containers:
        key = f"{c.container_type} {'装' if c.load_type == 'load' else '卸'}"
        g = cnt[key]
        g["count"] += 1
        try:
            g["workers"] += len(json.loads(c.worker_ids or "[]"))
        except (ValueError, TypeError):
            pass
        if c.start_time and c.end_time:
            g["minutes"] += compute_hours(c.start_time, c.end_time) * 60
            g["timed"] += 1
    container_rows = sorted(({
        "type": k, "count": v["count"],
        "avg_minutes": round(v["minutes"] / v["timed"]) if v["timed"] else None,
        "avg_team": round(v["workers"] / v["count"], 1) if v["count"] else None,
    } for k, v in cnt.items()), key=lambda r: -r["count"])

    # Quality events — no employee identity
    qe = db.scalars(select(QualityEvent).where(
        QualityEvent.event_date >= df, QualityEvent.event_date <= dt, QualityEvent.warehouse_code.in_(whs))
        .order_by(QualityEvent.event_date.desc(), QualityEvent.id.desc()).limit(200)).all()
    quality = [{"date": str(q.event_date), "type": EVENT_LABELS.get(q.event_type, q.event_type),
                "severity": q.severity, "qty": q.qty, "client": q.client, "ref_no": q.ref_no,
                "description": q.description} for q in qe]

    t = total[0] if len(total) == 1 else None
    if len(total) > 1:  # several warehouses: aggregate
        earned = sum(r["earned_hours"] for r in total)
        measured = sum(r["measured_hours"] for r in total)
        qty = sum(r["qty"] for r in total)
        errs = sum(r["error_qty"] for r in total)
        t = {"total_hours": round(sum(r["total_hours"] for r in total), 2), "records": sum(r["records"] for r in total),
             "efficiency": round(earned / measured * 100, 1) if measured else None,
             "error_rate": round(errs / qty * 100, 2) if qty else 0.0,
             "client_amount": round(sum(r["client_amount"] for r in total), 2),
             "days": len({x["date"] for x in daily if x["records"]})}
    t = t or {}
    return {
        "warehouses": whs,
        "period": {"from": str(df), "to": str(dt)},
        "kpi": {
            "records": t.get("records", 0),
            "total_hours": t.get("total_hours", 0.0),
            "headcount": headcount,
            "working_days": t.get("days", 0),
            "efficiency": t.get("efficiency"),
            "error_rate": t.get("error_rate", 0.0),
            "quality_events": len(quality),
            "containers": len(containers),
            "client_amount": t.get("client_amount", 0.0),
            "pending_records": pending,
        },
        "daily": daily,
        "by_operation": [_public_row(r) for r in by_op],
        "by_client": [_public_row(r) for r in by_client],
        "containers": container_rows,
        "quality": quality,
    }


@router.get("/overview")
def overview(warehouse: Optional[str] = Query(None), date_from: Optional[str] = None, date_to: Optional[str] = None,
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _build(user, db, warehouse, date_from, date_to)


@router.get("/export")
def export(warehouse: Optional[str] = Query(None), date_from: Optional[str] = None, date_to: Optional[str] = None,
           user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Operation summary per day × operation type (CSV) — the client's reconciliation sheet."""
    data = _build(user, db, warehouse, date_from, date_to)
    df, dt = date.fromisoformat(data["period"]["from"]), date.fromisoformat(data["period"]["to"])
    whs = data["warehouses"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["date", "warehouse", "operation", "unit", "qty", "hours", "uph", "efficiency_%", "error_qty",
                "client_amount_€"])
    d = df
    while d <= dt:
        for wh in whs:
            for r in compute_performance(db, d, d, group_by="op_type", warehouse_code=wh, confirmed_only=True):
                w.writerow([d, wh, r.get("label"), r.get("unit"), r["qty"], r["total_hours"], r["uph"],
                            r["efficiency"], r["error_qty"], r["client_amount"]])
        d += timedelta(days=1)
    name = f"operations_{'-'.join(whs)}_{data['period']['from']}_{data['period']['to']}.csv"
    return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8-sig")), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={name}"})
