"""
渊博579 HR V7 — Employees Router
"""
from __future__ import annotations
import csv
import io
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.user import User
from backend.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])

_SENSITIVE = {"tax_id", "social_security_no", "iban"}
_ALLOWED_ROLES_SENSITIVE = {"admin", "hr", "fin"}


def _strip_sensitive(emp_dict: dict, role: str) -> dict:
    if role not in _ALLOWED_ROLES_SENSITIVE:
        for f in _SENSITIVE:
            emp_dict[f] = None
    return emp_dict


def _next_emp_no(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"YB-{year}-"
    max_no = db.scalar(
        select(func.max(Employee.emp_no)).where(Employee.emp_no.like(f"{prefix}%"))
    )
    if max_no:
        try:
            seq = int(max_no.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


def _apply_row_filter(stmt, user: User):
    if user.role == "sup":
        stmt = stmt.where(Employee.supplier_id == user.bound_supplier_id)
    elif user.role == "wh":
        stmt = stmt.where(Employee.primary_warehouse == user.bound_warehouse)
    elif user.role == "worker":
        stmt = stmt.where(Employee.id == -1)
    return stmt


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    status: Optional[str] = Query(None),
    biz_line: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Employee)
    stmt = _apply_row_filter(stmt, user)
    if status:
        stmt = stmt.where(Employee.status == status)
    if biz_line:
        stmt = stmt.where(Employee.biz_line == biz_line)
    if source_type:
        stmt = stmt.where(Employee.source_type == source_type)
    if q:
        q_escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(
            Employee.name.ilike(f"%{q_escaped}%") | Employee.emp_no.ilike(f"%{q_escaped}%") | Employee.phone.ilike(f"%{q_escaped}%")
        )
    emps = db.scalars(stmt.offset(skip).limit(limit)).all()
    result = []
    for emp in emps:
        d = EmployeeOut.model_validate(emp).model_dump()
        result.append(_strip_sensitive(d, user.role))
    return result


@router.get("/export")
def export_employees(
    status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    biz_line: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export employee roster as CSV (admin/hr only)."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")

    stmt = select(Employee).order_by(Employee.emp_no)
    stmt = _apply_row_filter(stmt, user)
    if status:
        stmt = stmt.where(Employee.status == status)
    if source_type:
        stmt = stmt.where(Employee.source_type == source_type)
    if biz_line:
        stmt = stmt.where(Employee.biz_line == biz_line)

    employees = db.scalars(stmt).all()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    headers = [
        "emp_no", "name", "phone", "email", "nationality", "gender",
        "biz_line", "primary_warehouse", "position", "grade",
        "settlement_type", "hourly_rate", "status", "source_type",
        "join_date", "leave_date", "department", "notes",
    ]
    # Sensitive fields only for admin/hr/fin
    if user.role in _ALLOWED_ROLES_SENSITIVE:
        headers += ["tax_id", "social_security_no", "iban"]

    writer.writerow(headers)
    for emp in employees:
        row = [
            emp.emp_no, emp.name, emp.phone, emp.email, emp.nationality,
            emp.gender, emp.biz_line, emp.primary_warehouse, emp.position,
            emp.grade, emp.settlement_type, emp.hourly_rate, emp.status,
            emp.source_type, emp.join_date, emp.leave_date, emp.department,
            emp.notes,
        ]
        if user.role in _ALLOWED_ROLES_SENSITIVE:
            row += [emp.tax_id, emp.social_security_no, emp.iban]
        writer.writerow(row)

    csv_data = output.getvalue().encode("utf-8-sig")
    period = datetime.utcnow().strftime("%Y%m%d")
    filename = f"employees_{period}.csv"
    return StreamingResponse(
        io.BytesIO(csv_data),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(
    body: EmployeeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    emp = Employee(**body.model_dump(), emp_no=_next_emp_no(db))
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return EmployeeOut.model_validate(emp)


@router.get("/{emp_id}", response_model=EmployeeOut)
def get_employee(
    emp_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(404, "Employee not found")
    d = EmployeeOut.model_validate(emp).model_dump()
    return _strip_sensitive(d, user.role)


@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(
    emp_id: int,
    body: EmployeeUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    emp = db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(404, "Employee not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(emp, k, v)
    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)
    return EmployeeOut.model_validate(emp)


@router.delete("/{emp_id}", status_code=204)
def delete_employee(
    emp_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    emp = db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(404, "Employee not found")
    emp.status = "inactive"
    db.commit()
