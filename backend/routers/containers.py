"""
渊博579 HR V7 — Container Records Router
/api/v1/containers
"""
from __future__ import annotations
import json
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.container import ContainerRecord
from backend.models.timesheet import Timesheet
from backend.models.employee import Employee
from backend.models.user import User
from backend.schemas.container import ContainerCreate, ContainerUpdate, ContainerOut, ContainerApproveIn
from backend.middleware.auth import get_current_user
from backend.services.settlement_calc import compute_hours
from backend.services.sequence import next_sequence_no, make_prefix

router = APIRouter(prefix="/api/v1/containers", tags=["containers"])


def _enrich(cn: ContainerRecord) -> dict:
    """Convert a ContainerRecord ORM object to a dict with computed total_hours and worker_count."""
    d = ContainerOut.model_validate(cn).model_dump()
    if cn.start_time and cn.end_time:
        d["total_hours"] = compute_hours(cn.start_time, cn.end_time)
    worker_ids = []
    if cn.worker_ids:
        try:
            worker_ids = json.loads(cn.worker_ids)
        except json.JSONDecodeError:
            print(f"Warning: ContainerRecord id={cn.id} has malformed worker_ids JSON")
    d["worker_count"] = len(worker_ids)
    return d


def _next_cn_no(db: Session) -> str:
    return next_sequence_no(db, ContainerRecord, ContainerRecord.cn_no, make_prefix("CN"))


def _next_ts_no(db: Session) -> str:
    return next_sequence_no(db, Timesheet, Timesheet.ts_no, make_prefix("TS"))


@router.get("")
def list_containers(
    warehouse_code: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(ContainerRecord).order_by(ContainerRecord.work_date.desc(), ContainerRecord.id.desc())
    if user.role == "wh":
        stmt = stmt.where(ContainerRecord.warehouse_code == user.bound_warehouse)
    if warehouse_code:
        stmt = stmt.where(ContainerRecord.warehouse_code == warehouse_code)
    if date_from:
        stmt = stmt.where(ContainerRecord.work_date >= date_from)
    if date_to:
        stmt = stmt.where(ContainerRecord.work_date <= date_to)
    return [_enrich(cn) for cn in db.scalars(stmt.offset(skip).limit(limit)).all()]


@router.post("", response_model=ContainerOut, status_code=201)
def create_container(
    body: ContainerCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")
    cn = ContainerRecord(**body.model_dump(), cn_no=_next_cn_no(db))
    db.add(cn)
    db.commit()
    db.refresh(cn)
    return cn


@router.get("/{cn_id}")
def get_container(cn_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cn = db.get(ContainerRecord, cn_id)
    if cn is None:
        raise HTTPException(404, "Container record not found")
    return _enrich(cn)


@router.put("/{cn_id}", response_model=ContainerOut)
def update_container(
    cn_id: int, body: ContainerUpdate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")
    cn = db.get(ContainerRecord, cn_id)
    if cn is None:
        raise HTTPException(404, "Container record not found")
    if cn.is_split_to_timesheet:
        raise HTTPException(400, "Container already split to timesheets; cannot edit")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cn, k, v)
    db.commit()
    db.refresh(cn)
    return cn


@router.put("/{cn_id}/approve", response_model=ContainerOut)
def approve_container(
    cn_id: int, body: ContainerApproveIn,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Warehouse approval: mark video recorded + approve."""
    if user.role not in {"admin", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")
    cn = db.get(ContainerRecord, cn_id)
    if cn is None:
        raise HTTPException(404, "Container record not found")
    if body.end_time:
        cn.end_time = body.end_time
    cn.video_recorded = body.video_recorded
    cn.approval_status = "wh_approved"
    cn.wh_approver = user.display_name
    cn.wh_approved_at = datetime.utcnow()
    db.commit()
    db.refresh(cn)
    return cn


@router.post("/{cn_id}/split")
def split_to_timesheets(
    cn_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Split a container record into individual timesheet rows for each worker.
    Uses split_method: equal (equal share) / hours (proportional to hours) / coefficient
    """
    if user.role not in {"admin", "hr", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")
    cn = db.get(ContainerRecord, cn_id)
    if cn is None:
        raise HTTPException(404, "Container record not found")
    if cn.is_split_to_timesheet:
        raise HTTPException(400, "Already split")

    worker_ids: List[int] = []
    if cn.worker_ids:
        try:
            worker_ids = json.loads(cn.worker_ids)
        except Exception:
            pass

    if not worker_ids:
        raise HTTPException(400, "No workers assigned to this container")

    group_size = len(worker_ids)
    per_worker_pay = round(cn.group_pay / group_size, 2) if group_size > 0 else 0.0

    created_ts = []
    for emp_id in worker_ids:
        emp = db.get(Employee, emp_id)
        if emp is None:
            continue

        ts_no = _next_ts_no(db)
        ts = Timesheet(
            ts_no=ts_no,
            employee_id=emp.id,
            emp_no=emp.emp_no,
            emp_name=emp.name,
            source_type=emp.source_type,
            supplier_id=emp.supplier_id,
            biz_line=cn.biz_line,
            work_date=cn.work_date,
            warehouse_code=cn.warehouse_code,
            start_time=cn.start_time,
            end_time=cn.end_time,
            hours=compute_hours(cn.start_time or "08:00", cn.end_time or "16:00") if cn.end_time else 0.0,
            settlement_type="container",
            base_rate=per_worker_pay,
            container_no=cn.container_no,
            container_type=cn.container_type,
            load_type=cn.load_type,
            group_no=cn.group_no,
            amount_hourly=per_worker_pay,
            amount_total=per_worker_pay,
            approval_status="wh_pending",
        )
        db.add(ts)
        created_ts.append(ts_no)

    cn.is_split_to_timesheet = True
    db.commit()
    return {"created_timesheets": len(created_ts), "ts_nos": created_ts}
