"""
渊博579 HR V7 — Dashboard Router
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.warehouse import Warehouse
from backend.models.timesheet import Timesheet
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_employees = db.scalar(select(func.count(Employee.id)).where(Employee.status == "active")) or 0
    total_suppliers = db.scalar(select(func.count(Supplier.id)).where(Supplier.status == "active")) or 0
    total_warehouses = db.scalar(select(func.count(Warehouse.id)).where(Warehouse.status == "active")) or 0

    # Pending timesheets (wh_pending + fin_pending)
    pending_timesheets = db.scalar(
        select(func.count(Timesheet.id)).where(
            Timesheet.approval_status.in_(["wh_pending", "fin_pending"])
        )
    ) or 0

    # Current month total hours (booked timesheets)
    now = datetime.utcnow()
    first_day = now.replace(day=1).date()
    current_month_hours = db.scalar(
        select(func.sum(Timesheet.hours)).where(
            Timesheet.approval_status == "booked",
            Timesheet.work_date >= first_day,
        )
    ) or 0.0

    return {
        "active_employees": active_employees,
        "total_suppliers": total_suppliers,
        "total_warehouses": total_warehouses,
        "pending_timesheets": pending_timesheets,
        "current_month_hours": round(float(current_month_hours), 1),
    }
