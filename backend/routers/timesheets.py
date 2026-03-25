"""
渊博579 HR V7 — Timesheets Router
/api/v1/timesheets
"""
from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.timesheet import Timesheet
from backend.models.employee import Employee
from backend.models.user import User
from backend.schemas.timesheet import TimesheetCreate, TimesheetUpdate, TimesheetOut, TimesheetRejectIn
from backend.middleware.auth import get_current_user
from backend.services.settlement_calc import calc_settlement, calc_shift_bonus_rate, compute_hours

router = APIRouter(prefix="/api/v1/timesheets", tags=["timesheets"])


def _next_ts_no(db: Session) -> str:
    year = datetime.utcnow().year
    month = datetime.utcnow().month
    prefix = f"TS-{year}{month:02d}-"
    max_no = db.scalar(
        select(func.max(Timesheet.ts_no)).where(Timesheet.ts_no.like(f"{prefix}%"))
    )
    if max_no:
        try:
            seq = int(max_no.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def _apply_row_filter(stmt, user: User):
    """Row-level security: filter timesheets based on user role."""
    if user.role == "sup":
        stmt = stmt.where(Timesheet.supplier_id == user.bound_supplier_id)
    elif user.role == "wh":
        stmt = stmt.where(Timesheet.warehouse_code == user.bound_warehouse)
    elif user.role == "worker":
        # workers can only see their own timesheets — return empty until employee linkage is built
        stmt = stmt.where(Timesheet.id == -1)
    return stmt


def _compute_and_set_amounts(ts: Timesheet, emp: Employee, is_holiday: bool = False) -> None:
    """Recalculate hours and amounts for a timesheet row."""
    if ts.start_time and ts.end_time:
        computed_hours = compute_hours(ts.start_time, ts.end_time, ts.break_minutes)
        if ts.hours == 0.0:
            ts.hours = computed_hours

    shift_bonus_rate = calc_shift_bonus_rate(
        ts.work_date,
        ts.start_time or "08:00",
        ts.end_time or "16:00",
        is_holiday=is_holiday,
    )

    amounts = calc_settlement(
        settlement_type=ts.settlement_type,
        hours=ts.hours,
        base_rate=ts.base_rate,
        kpi_ratio=ts.kpi_ratio,
        pieces=ts.pieces,
        piece_rate=ts.piece_rate,
        shift_bonus_rate=shift_bonus_rate,
    )
    for k, v in amounts.items():
        setattr(ts, k, v)


@router.get("", response_model=list[TimesheetOut])
def list_timesheets(
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    warehouse_code: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    biz_line: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Timesheet).order_by(Timesheet.work_date.desc(), Timesheet.id.desc())
    stmt = _apply_row_filter(stmt, user)
    if status:
        stmt = stmt.where(Timesheet.approval_status == status)
    if date_from:
        stmt = stmt.where(Timesheet.work_date >= date_from)
    if date_to:
        stmt = stmt.where(Timesheet.work_date <= date_to)
    if warehouse_code:
        stmt = stmt.where(Timesheet.warehouse_code == warehouse_code)
    if employee_id:
        stmt = stmt.where(Timesheet.employee_id == employee_id)
    if biz_line:
        stmt = stmt.where(Timesheet.biz_line == biz_line)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("", response_model=TimesheetOut, status_code=201)
def create_timesheet(
    body: TimesheetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")

    emp = db.get(Employee, body.employee_id)
    if emp is None:
        raise HTTPException(404, "Employee not found")

    ts = Timesheet(
        **body.model_dump(),
        ts_no=_next_ts_no(db),
        emp_no=emp.emp_no,
        emp_name=emp.name,
        source_type=emp.source_type,
        supplier_id=emp.supplier_id,
        biz_line=emp.biz_line,
        base_rate=body.base_rate if body.base_rate > 0 else (emp.hourly_rate or 0.0),
        approval_status="draft",
    )
    _compute_and_set_amounts(ts, emp)
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@router.post("/batch", status_code=201)
def batch_create_timesheets(
    items: List[TimesheetCreate] = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    created = []
    for body in items:
        emp = db.get(Employee, body.employee_id)
        if emp is None:
            continue
        ts = Timesheet(
            **body.model_dump(),
            ts_no=_next_ts_no(db),
            emp_no=emp.emp_no,
            emp_name=emp.name,
            source_type=emp.source_type,
            supplier_id=emp.supplier_id,
            biz_line=emp.biz_line,
            base_rate=body.base_rate if body.base_rate > 0 else (emp.hourly_rate or 0.0),
            approval_status="draft",
        )
        _compute_and_set_amounts(ts, emp)
        db.add(ts)
        created.append(ts)
    db.commit()
    return {"created": len(created)}


@router.post("/batch-approve")
def batch_approve(
    ids: List[int] = Body(..., embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "wh", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    count = 0
    for ts_id in ids:
        ts = db.get(Timesheet, ts_id)
        if ts is None:
            continue
        now = datetime.utcnow()
        if ts.approval_status == "wh_pending" and user.role in {"admin", "wh", "mgr"}:
            ts.approval_status = "fin_pending"
            ts.wh_approver = user.display_name
            ts.wh_approved_at = now
            count += 1
        elif ts.approval_status == "fin_pending" and user.role in {"admin", "fin"}:
            ts.approval_status = "booked"
            ts.fin_approver = user.display_name
            ts.fin_approved_at = now
            count += 1
    db.commit()
    return {"approved": count}


@router.get("/{ts_id}", response_model=TimesheetOut)
def get_timesheet(ts_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ts = db.get(Timesheet, ts_id)
    if ts is None:
        raise HTTPException(404, "Timesheet not found")
    return ts


@router.put("/{ts_id}", response_model=TimesheetOut)
def update_timesheet(
    ts_id: int, body: TimesheetUpdate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    ts = db.get(Timesheet, ts_id)
    if ts is None:
        raise HTTPException(404, "Timesheet not found")
    if ts.approval_status not in {"draft", "rejected"}:
        raise HTTPException(400, "Only draft/rejected timesheets can be edited")
    if user.role not in {"admin", "hr", "wh", "mgr"}:
        raise HTTPException(403, "Forbidden")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ts, k, v)
    emp = db.get(Employee, ts.employee_id)
    if emp:
        _compute_and_set_amounts(ts, emp)
    ts.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ts)
    return ts


@router.put("/{ts_id}/submit", response_model=TimesheetOut)
def submit_timesheet(
    ts_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a draft timesheet for warehouse approval."""
    ts = db.get(Timesheet, ts_id)
    if ts is None:
        raise HTTPException(404, "Timesheet not found")
    if ts.approval_status != "draft":
        raise HTTPException(400, "Only draft timesheets can be submitted")
    ts.approval_status = "wh_pending"
    ts.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ts)
    return ts


@router.put("/{ts_id}/approve", response_model=TimesheetOut)
def approve_timesheet(
    ts_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Approval flow: wh_pending → wh approves → fin_pending → fin approves → booked
    wh role: approves wh_pending
    fin role: approves fin_pending
    admin: can approve any step
    """
    ts = db.get(Timesheet, ts_id)
    if ts is None:
        raise HTTPException(404, "Timesheet not found")

    now = datetime.utcnow()
    if ts.approval_status == "wh_pending":
        if user.role not in {"admin", "wh", "mgr"}:
            raise HTTPException(403, "Only warehouse manager can approve at this step")
        ts.approval_status = "fin_pending"
        ts.wh_approver = user.display_name
        ts.wh_approved_at = now
    elif ts.approval_status == "fin_pending":
        if user.role not in {"admin", "fin"}:
            raise HTTPException(403, "Only finance can approve at this step")
        ts.approval_status = "booked"
        ts.fin_approver = user.display_name
        ts.fin_approved_at = now
    elif ts.approval_status == "draft":
        # Admin can fast-track
        if user.role != "admin":
            raise HTTPException(400, "Submit first before approving")
        ts.approval_status = "booked"
        ts.wh_approver = user.display_name
        ts.wh_approved_at = now
        ts.fin_approver = user.display_name
        ts.fin_approved_at = now
    else:
        raise HTTPException(400, f"Cannot approve from status '{ts.approval_status}'")

    ts.updated_at = now
    db.commit()
    db.refresh(ts)
    return ts


@router.put("/{ts_id}/reject", response_model=TimesheetOut)
def reject_timesheet(
    ts_id: int, body: TimesheetRejectIn,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    ts = db.get(Timesheet, ts_id)
    if ts is None:
        raise HTTPException(404, "Timesheet not found")
    if ts.approval_status not in {"wh_pending", "fin_pending"}:
        raise HTTPException(400, "Can only reject pending timesheets")
    if user.role not in {"admin", "wh", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    ts.approval_status = "rejected"
    ts.reject_reason = body.reason
    ts.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ts)
    return ts
