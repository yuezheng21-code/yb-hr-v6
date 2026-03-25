"""
渊博579 HR V7 — Dashboard Router
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.warehouse import Warehouse
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_employees = db.scalar(select(func.count(Employee.id)).where(Employee.status == "active")) or 0
    total_suppliers = db.scalar(select(func.count(Supplier.id)).where(Supplier.status == "active")) or 0
    total_warehouses = db.scalar(select(func.count(Warehouse.id)).where(Warehouse.status == "active")) or 0
    return {
        "active_employees": active_employees,
        "total_suppliers": total_suppliers,
        "total_warehouses": total_warehouses,
        "pending_timesheets": 0,
        "current_month_hours": 0.0,
    }
