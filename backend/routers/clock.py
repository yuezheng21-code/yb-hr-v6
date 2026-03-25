"""
渊博579 HR V7 — Clock Router (punch in/out)
/api/v1/clock

Note: Employee linkage uses display_name matching as a bridge until a dedicated
user.employee_id FK is added. Workers are expected to have an Employee record
whose name matches user.display_name.
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.clock import ClockEvent
from backend.models.employee import Employee
from backend.models.user import User
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/clock", tags=["clock"])


def _resolve_employee(user: User, db: Session) -> Employee:
    """
    Resolve the Employee record for the current user.
    Strategy (in order):
      1. Match employee.name == user.display_name
      2. If none found, raise 404 — do NOT silently fall back to a random employee.
    """
    emp = db.scalar(select(Employee).where(Employee.name == user.display_name, Employee.status == "active"))
    if emp is None:
        raise HTTPException(
            status_code=404,
            detail=f"No active employee found for user '{user.display_name}'. "
                   "Please ask an admin to link your account to an employee record.",
        )
    return emp


@router.get("/today")
def today_clocks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get today's clock events for the current user's linked employee."""
    today = date.today()
    emp = _resolve_employee(user, db)
    events = db.scalars(
        select(ClockEvent)
        .where(ClockEvent.employee_id == emp.id)
        .where(ClockEvent.work_date == today)
        .order_by(ClockEvent.id)
    ).all()
    return [{"id": e.id, "clock_type": e.clock_type, "clock_time": e.clock_time, "emp_name": e.emp_name} for e in events]


@router.post("")
def clock_punch(
    clock_type: Optional[str] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Punch in or out for the current user's linked employee."""
    today = date.today()
    now_str = datetime.utcnow().strftime("%H:%M:%S")
    emp = _resolve_employee(user, db)

    # Auto-detect punch direction if not specified
    if clock_type is None:
        last_event = db.scalar(
            select(ClockEvent)
            .where(ClockEvent.employee_id == emp.id)
            .where(ClockEvent.work_date == today)
            .order_by(ClockEvent.id.desc())
        )
        clock_type = "out" if (last_event and last_event.clock_type == "in") else "in"

    event = ClockEvent(
        employee_id=emp.id,
        emp_name=emp.name,
        work_date=today,
        clock_type=clock_type,
        clock_time=now_str,
        warehouse_code=emp.primary_warehouse,
    )
    db.add(event)
    db.commit()
    return {"clock_type": clock_type, "clock_time": now_str, "emp_name": emp.name}
