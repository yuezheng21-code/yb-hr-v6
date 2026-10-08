"""
渊博579 HR V7 — 作业记录 & 绩效 Router
/api/v1/ops

独立模式：作业类型 / 手工录入 / 班组批量录入 / 工人自助报工 / 扫码工位 / Excel 导入
集成模式：WMS (马帮/领星/易仓/通用) API Key 推送 /api/v1/ops/ingest，卸柜记录同步
绩效：效率 / 质量 / 综合分 / 等级 / 计件金额，按员工·供应商·作业·客户·仓库·日期汇总
"""
from __future__ import annotations
import csv
import hashlib
import io
import json
import secrets
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Header, Body
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.container import ContainerRecord
from backend.models.operation import OperationType, OperationLog, QualityEvent, OperatorAlias, IngestSource
from backend.schemas.operation import (
    OperationTypeIn, OperationTypeUpdate, OperationLogIn, OperationLogUpdate, OperationBatchIn, IdsIn,
    SelfReportIn, StationScanIn, SyncContainersIn, QualityEventIn, OperatorAliasIn, IngestSourceIn,
    IngestSourceUpdate,
)
from backend.services.ops_ingest import (
    SYSTEM_PRESETS, FIELD_ALIASES, Matcher, apply_match, ingest_records, next_op_no, parse_mapping,
    read_tabular_file,
)
from backend.services.performance import compute_performance, GROUP_BY_OPTIONS, QUALITY_POINTS
from backend.services.settlement_calc import compute_hours
from backend.routers.clock import _resolve_employee

router = APIRouter(prefix="/api/v1/ops", tags=["operations"])

READ_ROLES = {"admin", "hr", "mgr", "fin", "wh", "sup"}
WRITE_ROLES = {"admin", "hr", "mgr", "wh"}
CONFIG_ROLES = {"admin", "hr", "mgr"}

CATEGORIES = ["inbound", "putaway", "picking", "packing", "labeling", "outbound", "returns", "inventory",
              "container", "project", "other"]
UNITS = ["件", "单", "行", "箱", "托", "柜", "m³", "小时"]
EVENT_TYPES = ["mispick", "damage", "missing_scan", "label_error", "safety", "absence", "complaint", "praise"]
SEVERITIES = list(QUALITY_POINTS.keys())
MAX_IMPORT_BYTES = 10 * 1024 * 1024
MAX_INGEST_RECORDS = 5000


def _require(user: User, roles: set) -> None:
    if user.role not in roles:
        raise HTTPException(403, "Forbidden")


def _scope_logs(stmt, user: User, db: Session):
    """Row-level security for operation logs / quality events."""
    model = stmt.column_descriptions[0]["entity"]
    if user.role == "sup":
        stmt = stmt.where(model.supplier_id == user.bound_supplier_id)
    elif user.role == "wh" and user.bound_warehouse:
        stmt = stmt.where(model.warehouse_code == user.bound_warehouse)
    elif user.role == "worker":
        emp = _resolve_employee(user, db)
        stmt = stmt.where(model.employee_id == emp.id)
    return stmt


def _check_wh(user: User, warehouse_code: Optional[str]) -> None:
    if user.role == "wh" and user.bound_warehouse and warehouse_code and warehouse_code != user.bound_warehouse:
        raise HTTPException(403, "仓库管理员只能操作本仓库数据")


def _parse_date(s: Optional[str], default: date) -> date:
    if not s:
        return default
    try:
        return date.fromisoformat(s)
    except ValueError:
        raise HTTPException(400, f"日期格式错误: {s}")


def _type_dict(t: OperationType) -> dict:
    return {c.name: getattr(t, c.name) for c in OperationType.__table__.columns}


def _log_dict(l: OperationLog, types: Optional[dict] = None) -> dict:
    d = {c.name: getattr(l, c.name) for c in OperationLog.__table__.columns}
    t = (types or {}).get(l.op_type_id)
    if t:
        d["op_name"] = t.name
        d["unit"] = t.unit
        d["uph"] = round(l.qty / l.hours, 1) if l.hours else None
        d["efficiency"] = round(l.qty / l.hours / t.standard_uph * 100, 1) if (l.hours and t.standard_uph) else None
    return d


def _types_map(db: Session) -> dict:
    return {t.id: t for t in db.scalars(select(OperationType)).all()}


def _new_log(db: Session, emp: Employee, t: OperationType, *, work_date: date, qty: float, user_name: str,
             source: str, hours: float = 0.0, error_qty: float = 0.0, start_time=None, end_time=None,
             warehouse_code=None, client=None, ref_no=None, notes=None) -> OperationLog:
    if not hours and start_time and end_time:
        hours = compute_hours(start_time, end_time)
    log = OperationLog(
        op_no=next_op_no(db), employee_id=emp.id, emp_no=emp.emp_no, emp_name=emp.name,
        supplier_id=emp.supplier_id, op_type_id=t.id, op_code=t.code, op_label=t.name,
        work_date=work_date, warehouse_code=warehouse_code or t.warehouse_code or emp.primary_warehouse,
        client=client or t.client, ref_no=ref_no, qty=qty, error_qty=error_qty, hours=hours or 0.0,
        start_time=start_time, end_time=end_time, source=source, status="pending",
        created_by=user_name, notes=notes,
    )
    db.add(log)
    db.flush()
    return log


# ═════════════════════════════════════════════════════════════════════
#  Meta
# ═════════════════════════════════════════════════════════════════════
@router.get("/meta")
def meta(user: User = Depends(get_current_user)):
    return {
        "systems": {k: v["label"] for k, v in SYSTEM_PRESETS.items()},
        "fields": list(FIELD_ALIASES.keys()),
        "field_aliases": FIELD_ALIASES,
        "categories": CATEGORIES,
        "units": UNITS,
        "event_types": EVENT_TYPES,
        "severities": SEVERITIES,
        "group_by": list(GROUP_BY_OPTIONS),
    }


# ═════════════════════════════════════════════════════════════════════
#  作业类型
# ═════════════════════════════════════════════════════════════════════
@router.get("/types")
def list_types(active_only: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(OperationType).order_by(OperationType.category, OperationType.code)
    if active_only:
        stmt = stmt.where(OperationType.is_active == True)  # noqa: E712
    return [_type_dict(t) for t in db.scalars(stmt).all()]


@router.post("/types", status_code=201)
def create_type(body: OperationTypeIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    code = body.code.strip().upper()
    if db.scalar(select(OperationType).where(OperationType.code == code)):
        raise HTTPException(400, f"作业代码已存在: {code}")
    t = OperationType(**{**body.model_dump(), "code": code})
    db.add(t)
    db.commit()
    db.refresh(t)
    return _type_dict(t)


@router.put("/types/{type_id}")
def update_type(type_id: int, body: OperationTypeUpdate, user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    t = db.get(OperationType, type_id)
    if t is None:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return _type_dict(t)


@router.delete("/types/{type_id}")
def delete_type(type_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    t = db.get(OperationType, type_id)
    if t is None:
        raise HTTPException(404, "Not found")
    used = db.scalar(select(func.count(OperationLog.id)).where(OperationLog.op_type_id == type_id)) or 0
    if used:
        t.is_active = False  # keep history intact
        db.commit()
        return {"ok": True, "deactivated": True, "used_by": used}
    db.delete(t)
    db.commit()
    return {"ok": True, "deleted": True}


# ═════════════════════════════════════════════════════════════════════
#  作业记录
# ═════════════════════════════════════════════════════════════════════
def _filtered_logs_stmt(user, db, date_from, date_to, status, employee_id, op_type_id, warehouse_code, client,
                        source, supplier_id, q):
    stmt = select(OperationLog)
    stmt = _scope_logs(stmt, user, db)
    if date_from:
        stmt = stmt.where(OperationLog.work_date >= _parse_date(date_from, date.today()))
    if date_to:
        stmt = stmt.where(OperationLog.work_date <= _parse_date(date_to, date.today()))
    if status:
        stmt = stmt.where(OperationLog.status == status)
    if employee_id:
        stmt = stmt.where(OperationLog.employee_id == employee_id)
    if op_type_id:
        stmt = stmt.where(OperationLog.op_type_id == op_type_id)
    if warehouse_code:
        stmt = stmt.where(OperationLog.warehouse_code == warehouse_code)
    if client:
        stmt = stmt.where(OperationLog.client == client)
    if source:
        stmt = stmt.where(OperationLog.source == source)
    if supplier_id:
        stmt = stmt.where(OperationLog.supplier_id == supplier_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(OperationLog.emp_name.ilike(like) | OperationLog.ref_no.ilike(like)
                          | OperationLog.operator_ref.ilike(like) | OperationLog.op_no.ilike(like))
    return stmt


@router.get("/logs")
def list_logs(
    date_from: Optional[str] = None, date_to: Optional[str] = None, status: Optional[str] = None,
    employee_id: Optional[int] = None, op_type_id: Optional[int] = None, warehouse_code: Optional[str] = None,
    client: Optional[str] = None, source: Optional[str] = None, supplier_id: Optional[int] = None,
    q: Optional[str] = None, skip: int = 0, limit: int = Query(300, le=2000),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    stmt = _filtered_logs_stmt(user, db, date_from, date_to, status, employee_id, op_type_id, warehouse_code,
                               client, source, supplier_id, q)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(OperationLog.work_date.desc(), OperationLog.id.desc())
                       .offset(skip).limit(limit)).all()
    types = _types_map(db)
    return {"total": total, "items": [_log_dict(l, types) for l in items]}


@router.get("/logs/export")
def export_logs(
    date_from: Optional[str] = None, date_to: Optional[str] = None, status: Optional[str] = None,
    employee_id: Optional[int] = None, op_type_id: Optional[int] = None, warehouse_code: Optional[str] = None,
    client: Optional[str] = None, source: Optional[str] = None, supplier_id: Optional[int] = None,
    q: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    stmt = _filtered_logs_stmt(user, db, date_from, date_to, status, employee_id, op_type_id, warehouse_code,
                               client, source, supplier_id, q)
    types = _types_map(db)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["op_no", "work_date", "emp_no", "emp_name", "operator_ref", "op_code", "op_name", "unit", "qty",
                "error_qty", "hours", "uph", "efficiency_%", "warehouse_code", "client", "ref_no", "source",
                "source_system", "status", "notes"])
    for l in db.scalars(stmt.order_by(OperationLog.work_date, OperationLog.id)).all():
        d = _log_dict(l, types)
        w.writerow([l.op_no, l.work_date, l.emp_no, l.emp_name, l.operator_ref, l.op_code, d.get("op_name"),
                    d.get("unit"), l.qty, l.error_qty, l.hours, d.get("uph"), d.get("efficiency"),
                    l.warehouse_code, l.client, l.ref_no, l.source, l.source_system, l.status, l.notes])
    return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8-sig")), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=operation_logs.csv"})


@router.post("/logs", status_code=201)
def create_log(body: OperationLogIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    emp = db.get(Employee, body.employee_id)
    t = db.get(OperationType, body.op_type_id)
    if emp is None or t is None:
        raise HTTPException(404, "员工或作业类型不存在")
    _check_wh(user, body.warehouse_code or user.bound_warehouse)
    log = _new_log(db, emp, t, work_date=body.work_date, qty=body.qty, hours=body.hours, error_qty=body.error_qty,
                   start_time=body.start_time, end_time=body.end_time,
                   warehouse_code=body.warehouse_code or (user.bound_warehouse if user.role == "wh" else None),
                   client=body.client, ref_no=body.ref_no, notes=body.notes, user_name=user.display_name,
                   source="manual")
    db.commit()
    return _log_dict(log, {t.id: t})


@router.post("/logs/batch", status_code=201)
def create_logs_batch(body: OperationBatchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    t = db.get(OperationType, body.op_type_id)
    if t is None:
        raise HTTPException(404, "作业类型不存在")
    wh = body.warehouse_code or (user.bound_warehouse if user.role == "wh" else None)
    _check_wh(user, wh)
    created = []
    for e in body.entries:
        if e.qty <= 0 and e.hours <= 0:
            continue
        emp = db.get(Employee, e.employee_id)
        if emp is None:
            continue
        log = _new_log(db, emp, t, work_date=body.work_date, qty=e.qty, hours=e.hours, error_qty=e.error_qty,
                       warehouse_code=wh, client=body.client, ref_no=body.ref_no, user_name=user.display_name,
                       source="manual")
        created.append(log.op_no)
    db.commit()
    return {"created": len(created), "op_nos": created}


@router.put("/logs/{log_id}")
def update_log(log_id: int, body: OperationLogUpdate, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    log = db.get(OperationLog, log_id)
    if log is None:
        raise HTTPException(404, "Not found")
    _check_wh(user, log.warehouse_code)
    if log.status == "confirmed" and user.role not in {"admin", "mgr"}:
        raise HTTPException(400, "已确认记录仅管理员/运营经理可修改")
    data = body.model_dump(exclude_unset=True)
    if "employee_id" in data:
        emp = db.get(Employee, data.pop("employee_id"))
        if emp is None:
            raise HTTPException(404, "员工不存在")
        log.employee_id, log.emp_no, log.emp_name, log.supplier_id = emp.id, emp.emp_no, emp.name, emp.supplier_id
    if "op_type_id" in data:
        t = db.get(OperationType, data.pop("op_type_id"))
        if t is None:
            raise HTTPException(404, "作业类型不存在")
        log.op_type_id, log.op_code = t.id, t.code
    for k, v in data.items():
        setattr(log, k, v)
    if ("start_time" in data or "end_time" in data) and "hours" not in data and log.start_time and log.end_time:
        log.hours = compute_hours(log.start_time, log.end_time)
    if log.status == "unmatched" and log.employee_id and log.op_type_id:
        log.status, log.match_issue = "pending", None
    db.commit()
    return _log_dict(log, _types_map(db))


@router.delete("/logs/{log_id}")
def delete_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    log = db.get(OperationLog, log_id)
    if log is None:
        raise HTTPException(404, "Not found")
    _check_wh(user, log.warehouse_code)
    if log.status == "confirmed" and user.role not in {"admin", "mgr"}:
        raise HTTPException(400, "已确认记录仅管理员/运营经理可删除")
    db.delete(log)
    db.commit()
    return {"ok": True}


def _bulk_status(db: Session, user: User, ids: list[int], status: str, reason: Optional[str] = None) -> dict:
    _require(user, WRITE_ROLES)
    stmt = _scope_logs(select(OperationLog).where(OperationLog.id.in_(ids or [-1])), user, db)
    n, skipped = 0, 0
    for log in db.scalars(stmt).all():
        if log.status == "unmatched":
            skipped += 1
            continue
        log.status = status
        log.confirmed_by = user.display_name
        log.confirmed_at = datetime.utcnow()
        if reason:
            log.notes = ((log.notes + " | ") if log.notes else "") + f"驳回: {reason}"
        n += 1
    db.commit()
    return {"updated": n, "skipped_unmatched": skipped}


@router.post("/logs/confirm")
def confirm_logs(body: IdsIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _bulk_status(db, user, body.ids, "confirmed")


@router.post("/logs/reject")
def reject_logs(body: IdsIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _bulk_status(db, user, body.ids, "rejected", body.reason)


@router.post("/logs/rematch")
def rematch_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """补充员工映射/作业类型后，重新匹配所有 unmatched 记录"""
    _require(user, WRITE_ROLES)
    logs = db.scalars(_scope_logs(select(OperationLog).where(OperationLog.status == "unmatched"), user, db)).all()
    matchers: dict = {}
    fixed = 0
    for log in logs:
        m = matchers.setdefault(log.source_system or "generic", Matcher(db, log.source_system or "generic"))
        apply_match(log, m)
        if log.status != "unmatched":
            fixed += 1
    db.commit()
    return {"checked": len(logs), "matched": fixed, "still_unmatched": len(logs) - fixed}


# ═════════════════════════════════════════════════════════════════════
#  工人自助报工 / 扫码工位
# ═════════════════════════════════════════════════════════════════════
@router.post("/report", status_code=201)
def self_report(body: SelfReportIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = _resolve_employee(user, db)
    t = db.get(OperationType, body.op_type_id)
    if t is None or not t.is_active:
        raise HTTPException(404, "作业类型不存在")
    log = _new_log(db, emp, t, work_date=date.today(), qty=body.qty, hours=body.hours, ref_no=body.ref_no,
                   warehouse_code=body.warehouse_code, user_name=user.display_name, source="scan",
                   notes="工人自助报工")
    db.commit()
    return _log_dict(log, {t.id: t})


@router.get("/my")
def my_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = _resolve_employee(user, db)
    today = date.today()
    month_start = today.replace(day=1)
    types = _types_map(db)
    today_logs = db.scalars(select(OperationLog).where(
        OperationLog.employee_id == emp.id, OperationLog.work_date == today).order_by(OperationLog.id)).all()
    perf = compute_performance(db, month_start, today, group_by="employee", employee_id=emp.id)
    return {
        "employee": {"id": emp.id, "name": emp.name, "emp_no": emp.emp_no},
        "today": [_log_dict(l, types) for l in today_logs],
        "month": perf[0] if perf else None,
    }


@router.post("/station", status_code=201)
def station_scan(body: StationScanIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """扫码工位（平板/扫码枪）：班组长终端登录后连续扫 工牌 → 作业条码 → 数量"""
    _require(user, WRITE_ROLES)
    m = Matcher(db, "*")
    emp = m.employee(body.badge.strip(), body.badge.strip())
    if emp is None:
        raise HTTPException(404, f"工牌未识别: {body.badge}")
    t = m.op_type(body.op_code)
    if t is None:
        raise HTTPException(404, f"作业条码未识别: {body.op_code}")
    wh = body.warehouse_code or (user.bound_warehouse if user.role == "wh" else None)
    log = _new_log(db, emp, t, work_date=date.today(), qty=body.qty, ref_no=body.ref_no, warehouse_code=wh,
                   user_name=user.display_name, source="scan")
    db.commit()
    return {"ok": True, "emp_name": emp.name, "op_name": t.name, "qty": log.qty, "op_no": log.op_no}


# ═════════════════════════════════════════════════════════════════════
#  导入 (Excel/CSV) & 卸柜同步
# ═════════════════════════════════════════════════════════════════════
@router.get("/import/template")
def import_template(user: User = Depends(get_current_user)):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["日期", "工号", "操作员", "作业类型", "数量", "差错数", "开始时间", "结束时间", "工时", "仓库", "客户",
                "单号", "作业单号", "备注"])
    w.writerow([date.today().isoformat(), "", "张三", "PICK", "320", "0", "08:00", "12:00", "", "UNA", "Amazon",
                "WAVE-001", "T-0001", ""])
    return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8-sig")), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=ops_import_template.csv"})


@router.post("/import")
async def import_file(
    file: UploadFile = File(...),
    system: str = Form("generic"),
    dry_run: bool = Form(True),
    default_warehouse: Optional[str] = Form(None),
    default_client: Optional[str] = Form(None),
    default_date: Optional[str] = Form(None),
    field_mapping: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require(user, WRITE_ROLES)
    if system not in SYSTEM_PRESETS:
        raise HTTPException(400, f"未知系统: {system}")
    content = await file.read()
    if len(content) > MAX_IMPORT_BYTES:
        raise HTTPException(413, "文件过大（上限 10MB）")
    try:
        records = read_tabular_file(file.filename or "", content)
    except Exception as exc:
        raise HTTPException(400, f"文件解析失败: {exc}")
    if not records:
        raise HTTPException(400, "文件无数据行")
    wh = default_warehouse or (user.bound_warehouse if user.role == "wh" else None)
    result = ingest_records(
        db, records, source="import", system=system, field_mapping=parse_mapping(field_mapping),
        default_warehouse=wh, default_client=default_client,
        default_date=_parse_date(default_date, None) if default_date else None,
        created_by=user.display_name, dry_run=dry_run,
    )
    if dry_run:
        db.rollback()
    else:
        db.commit()
    return result


def _container_op_code(container_type: str, load_type: str) -> str:
    size = {"20GP": "20", "40GP": "40", "40HC": "40", "45HC": "45", "LKW": "LKW"}.get(container_type, container_type)
    return f"CNT_{'L' if load_type == 'load' else 'U'}{size}"


@router.post("/sync/containers")
def sync_containers(body: SyncContainersIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """把已审批的卸柜记录按人头分摊为作业记录（每人 1/n 柜），幂等可重复执行"""
    _require(user, WRITE_ROLES)
    stmt = select(ContainerRecord).where(
        ContainerRecord.work_date >= body.date_from, ContainerRecord.work_date <= body.date_to,
        ContainerRecord.approval_status.in_(["wh_approved", "fin_approved"]))
    if user.role == "wh" and user.bound_warehouse:
        stmt = stmt.where(ContainerRecord.warehouse_code == user.bound_warehouse)
    matcher = Matcher(db, "*")
    created, skipped, containers = 0, 0, 0
    next_no = None
    for cn in db.scalars(stmt).all():
        try:
            worker_ids = json.loads(cn.worker_ids or "[]")
        except json.JSONDecodeError:
            worker_ids = []
        if not worker_ids:
            continue
        containers += 1
        code = _container_op_code(cn.container_type, cn.load_type)
        t = matcher.op_type(code)
        hours = compute_hours(cn.start_time, cn.end_time) if (cn.start_time and cn.end_time) else 0.0
        for emp_id in worker_ids:
            ext = f"container:{cn.cn_no}:{emp_id}"
            if db.scalar(select(OperationLog.id).where(OperationLog.source == "container",
                                                       OperationLog.external_ref == ext)):
                skipped += 1
                continue
            emp = db.get(Employee, emp_id)
            if emp is None:
                continue
            if next_no is None:
                next_no = next_op_no(db)
            prefix, seq = next_no.rsplit("-", 1)
            log = OperationLog(
                op_no=next_no, employee_id=emp.id, emp_no=emp.emp_no, emp_name=emp.name,
                supplier_id=emp.supplier_id, op_type_id=t.id if t else None, op_code=t.code if t else code,
                op_label=f"{cn.container_type} {'装柜' if cn.load_type == 'load' else '卸柜'}",
                work_date=cn.work_date, warehouse_code=cn.warehouse_code, ref_no=cn.container_no,
                client=t.client if t else None, qty=round(1 / len(worker_ids), 4), hours=hours,
                start_time=cn.start_time, end_time=cn.end_time, source="container", external_ref=ext,
                status="confirmed" if t else "unmatched",
                match_issue=None if t else f"作业类型未配置: {code}",
                confirmed_by=cn.wh_approver, confirmed_at=cn.wh_approved_at, created_by=user.display_name,
            )
            next_no = f"{prefix}-{int(seq) + 1:0{len(seq)}d}"
            db.add(log)
            created += 1
    db.commit()
    return {"containers": containers, "created": created, "skipped_existing": skipped}


# ═════════════════════════════════════════════════════════════════════
#  WMS 推送接口（API Key）
# ═════════════════════════════════════════════════════════════════════
def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


@router.post("/ingest")
def ingest(
    payload: dict | list = Body(...),
    x_api_key: Optional[str] = Header(None),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    外部系统推送作业记录。Header: X-API-Key: <key>
    Body: {"records": [ {...}, ... ]} 或直接数组。字段名可用中/英/德常见列名，或在接入源上配置 field_mapping。
    以 external_ref（作业单号/任务ID）做幂等，重复推送自动跳过。
    """
    if not x_api_key:
        raise HTTPException(401, "Missing X-API-Key")
    src = db.scalar(select(IngestSource).where(IngestSource.key_hash == _hash_key(x_api_key)))
    if src is None or not src.enabled:
        raise HTTPException(401, "Invalid or disabled API key")
    records = payload.get("records") if isinstance(payload, dict) else payload
    if not isinstance(records, list) or not all(isinstance(r, dict) for r in records):
        raise HTTPException(400, "records must be a list of objects")
    if len(records) > MAX_INGEST_RECORDS:
        raise HTTPException(413, f"单次最多 {MAX_INGEST_RECORDS} 条")
    result = ingest_records(
        db, records, source="api", system=src.system, field_mapping=parse_mapping(src.field_mapping),
        default_warehouse=src.default_warehouse, default_client=src.default_client,
        auto_confirm=src.auto_confirm, created_by=f"API:{src.name}", dry_run=dry_run,
    )
    if dry_run:
        db.rollback()
    else:
        src.last_used_at = datetime.utcnow()
        src.total_received = (src.total_received or 0) + result["created"]
        db.commit()
    return result


def _source_dict(s: IngestSource) -> dict:
    return {
        "id": s.id, "name": s.name, "system": s.system, "key_prefix": s.key_prefix,
        "default_warehouse": s.default_warehouse, "default_client": s.default_client,
        "field_mapping": parse_mapping(s.field_mapping), "auto_confirm": s.auto_confirm, "enabled": s.enabled,
        "last_used_at": s.last_used_at, "total_received": s.total_received, "created_at": s.created_at,
    }


def _new_key() -> str:
    return "ybk_" + secrets.token_urlsafe(32)


@router.get("/sources")
def list_sources(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, {"admin"})
    return [_source_dict(s) for s in db.scalars(select(IngestSource).order_by(IngestSource.id)).all()]


@router.post("/sources", status_code=201)
def create_source(body: IngestSourceIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, {"admin"})
    if body.system not in SYSTEM_PRESETS:
        raise HTTPException(400, f"未知系统: {body.system}")
    key = _new_key()
    data = body.model_dump()
    data["field_mapping"] = json.dumps(body.field_mapping, ensure_ascii=False) if body.field_mapping else None
    s = IngestSource(**data, key_prefix=key[:10], key_hash=_hash_key(key))
    db.add(s)
    db.commit()
    db.refresh(s)
    return {**_source_dict(s), "api_key": key}


@router.put("/sources/{source_id}")
def update_source(source_id: int, body: IngestSourceUpdate, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    _require(user, {"admin"})
    s = db.get(IngestSource, source_id)
    if s is None:
        raise HTTPException(404, "Not found")
    data = body.model_dump(exclude_unset=True)
    if "system" in data and data["system"] not in SYSTEM_PRESETS:
        raise HTTPException(400, f"未知系统: {data['system']}")
    if "field_mapping" in data:
        data["field_mapping"] = json.dumps(data["field_mapping"], ensure_ascii=False) if data["field_mapping"] else None
    for k, v in data.items():
        setattr(s, k, v)
    db.commit()
    return _source_dict(s)


@router.post("/sources/{source_id}/rotate")
def rotate_source_key(source_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, {"admin"})
    s = db.get(IngestSource, source_id)
    if s is None:
        raise HTTPException(404, "Not found")
    key = _new_key()
    s.key_prefix, s.key_hash = key[:10], _hash_key(key)
    db.commit()
    return {**_source_dict(s), "api_key": key}


@router.delete("/sources/{source_id}")
def delete_source(source_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, {"admin"})
    s = db.get(IngestSource, source_id)
    if s is None:
        raise HTTPException(404, "Not found")
    db.delete(s)
    db.commit()
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════
#  操作员账号映射
# ═════════════════════════════════════════════════════════════════════
@router.get("/aliases")
def list_aliases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    rows = db.execute(select(OperatorAlias, Employee.name, Employee.emp_no)
                      .join(Employee, Employee.id == OperatorAlias.employee_id)
                      .order_by(OperatorAlias.system, OperatorAlias.alias)).all()
    return [{"id": a.id, "system": a.system, "alias": a.alias, "employee_id": a.employee_id,
             "emp_name": name, "emp_no": no} for a, name, no in rows]


@router.get("/aliases/unmatched")
def unmatched_operators(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """未识别的操作员账号（便于逐个映射）"""
    _require(user, WRITE_ROLES)
    stmt = _scope_logs(select(OperationLog).where(OperationLog.status == "unmatched",
                                                  OperationLog.employee_id.is_(None)), user, db)
    counts: dict = {}
    for l in db.scalars(stmt).all():
        k = (l.source_system or "generic", l.operator_ref or l.emp_no or "")
        counts[k] = counts.get(k, 0) + 1
    return [{"system": s, "alias": a, "records": n} for (s, a), n in sorted(counts.items(), key=lambda x: -x[1])]


@router.post("/aliases", status_code=201)
def create_alias(body: OperatorAliasIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    if db.get(Employee, body.employee_id) is None:
        raise HTTPException(404, "员工不存在")
    alias = body.alias.strip()
    existing = db.scalar(select(OperatorAlias).where(OperatorAlias.system == body.system,
                                                     OperatorAlias.alias == alias))
    if existing:
        existing.employee_id = body.employee_id
    else:
        db.add(OperatorAlias(system=body.system, alias=alias, employee_id=body.employee_id))
    db.commit()
    return {"ok": True}


@router.delete("/aliases/{alias_id}")
def delete_alias(alias_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    a = db.get(OperatorAlias, alias_id)
    if a is None:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════
#  质量事件
# ═════════════════════════════════════════════════════════════════════
@router.get("/quality")
def list_quality(date_from: Optional[str] = None, date_to: Optional[str] = None, employee_id: Optional[int] = None,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = _scope_logs(select(QualityEvent), user, db)
    if date_from:
        stmt = stmt.where(QualityEvent.event_date >= _parse_date(date_from, date.today()))
    if date_to:
        stmt = stmt.where(QualityEvent.event_date <= _parse_date(date_to, date.today()))
    if employee_id:
        stmt = stmt.where(QualityEvent.employee_id == employee_id)
    return [{c.name: getattr(q, c.name) for c in QualityEvent.__table__.columns}
            for q in db.scalars(stmt.order_by(QualityEvent.event_date.desc(), QualityEvent.id.desc())
                                .limit(500)).all()]


@router.post("/quality", status_code=201)
def create_quality(body: QualityEventIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, WRITE_ROLES)
    if body.severity not in SEVERITIES:
        raise HTTPException(400, f"severity must be one of {SEVERITIES}")
    emp = db.get(Employee, body.employee_id)
    if emp is None:
        raise HTTPException(404, "员工不存在")
    wh = body.warehouse_code or (user.bound_warehouse if user.role == "wh" else None)
    _check_wh(user, wh)
    q = QualityEvent(**{**body.model_dump(), "warehouse_code": wh}, emp_name=emp.name,
                     supplier_id=emp.supplier_id, created_by=user.display_name)
    db.add(q)
    db.commit()
    return {"ok": True, "id": q.id}


@router.delete("/quality/{event_id}")
def delete_quality(event_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require(user, CONFIG_ROLES)
    q = db.get(QualityEvent, event_id)
    if q is None:
        raise HTTPException(404, "Not found")
    db.delete(q)
    db.commit()
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════
#  绩效
# ═════════════════════════════════════════════════════════════════════
def _perf(user: User, db: Session, date_from, date_to, group_by, warehouse_code, client, supplier_id, employee_id,
          confirmed_only, w_efficiency, w_quality):
    _require(user, READ_ROLES | {"worker"})
    today = date.today()
    df = _parse_date(date_from, today.replace(day=1))
    dt = _parse_date(date_to, today)
    if user.role == "sup":
        supplier_id = user.bound_supplier_id or -1
    elif user.role == "wh" and user.bound_warehouse:
        warehouse_code = user.bound_warehouse
    elif user.role == "worker":
        employee_id = _resolve_employee(user, db).id
    return compute_performance(
        db, df, dt, group_by=group_by, warehouse_code=warehouse_code, client=client, supplier_id=supplier_id,
        employee_id=employee_id, confirmed_only=confirmed_only, w_efficiency=w_efficiency, w_quality=w_quality,
    )


@router.get("/performance")
def performance(
    date_from: Optional[str] = None, date_to: Optional[str] = None, group_by: str = "employee",
    warehouse_code: Optional[str] = None, client: Optional[str] = None, supplier_id: Optional[int] = None,
    employee_id: Optional[int] = None, confirmed_only: bool = False,
    w_efficiency: float = Query(0.7, ge=0, le=1), w_quality: float = Query(0.3, ge=0, le=1),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    rows = _perf(user, db, date_from, date_to, group_by, warehouse_code, client, supplier_id, employee_id,
                 confirmed_only, w_efficiency, w_quality)
    scored = [r for r in rows if r["score"] is not None]
    return {
        "group_by": group_by,
        "rows": rows,
        "summary": {
            "groups": len(rows),
            "qty": round(sum(r["qty"] for r in rows), 2),
            "total_hours": round(sum(r["total_hours"] for r in rows), 2),
            "avg_efficiency": round(sum(r["earned_hours"] for r in rows) /
                                    sum(r["measured_hours"] for r in rows) * 100, 1)
            if sum(r["measured_hours"] for r in rows) > 0 else None,
            "avg_score": round(sum(r["score"] for r in scored) / len(scored), 1) if scored else None,
            "piece_amount": round(sum(r["piece_amount"] for r in rows), 2),
            "client_amount": round(sum(r["client_amount"] for r in rows), 2),
            "grades": {g: sum(1 for r in rows if r["grade"] == g) for g in ("A", "B", "C", "D", "-")},
        },
    }


@router.get("/performance/export")
def performance_export(
    date_from: Optional[str] = None, date_to: Optional[str] = None, group_by: str = "employee",
    warehouse_code: Optional[str] = None, client: Optional[str] = None, supplier_id: Optional[int] = None,
    confirmed_only: bool = False,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    rows = _perf(user, db, date_from, date_to, group_by, warehouse_code, client, supplier_id, None,
                 confirmed_only, 0.7, 0.3)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["rank", "label", "emp_no", "supplier", "headcount", "days", "records", "qty", "error_qty",
                "error_rate_%", "total_hours", "earned_hours", "uph", "efficiency_%", "quality_events",
                "quality_score", "score", "grade", "piece_amount_€", "client_amount_€", "deductions_€", "ops"])
    for r in rows:
        w.writerow([r["rank"], r.get("label"), r.get("emp_no", ""), r.get("supplier_name", ""), r["headcount"],
                    r["days"], r["records"], r["qty"], r["error_qty"], r["error_rate"], r["total_hours"],
                    r["earned_hours"], r["uph"], r["efficiency"], r["quality_events"], r["quality_score"],
                    r["score"], r["grade"], r["piece_amount"], r["client_amount"], r["deductions"],
                    "; ".join(f"{k}={v}" for k, v in r["ops"].items())])
    return StreamingResponse(io.BytesIO(buf.getvalue().encode("utf-8-sig")), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename=performance_{group_by}.csv"})
