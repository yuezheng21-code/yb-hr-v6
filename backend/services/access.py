"""Permission and employee row-scope checks shared by personnel endpoints."""
from __future__ import annotations
import json
from fastapi import HTTPException
from backend.models.employee import Employee

ROLE_PERMISSIONS = {
    "admin": {"*"},
    "hr": {"employees.read", "employees.write", "personnel.read", "personnel.request", "personnel.approve", "changes.read", "changes.export"},
    "mgr": {"employees.read", "personnel.request", "personnel.approve", "changes.read", "changes.export"},
    "wh": {"employees.read", "changes.read"},
    "sup": {"employees.read", "changes.read", "changes.export"},
    "fin": {"employees.read"},
    "worker": set(),
    "client": set(),
}


def permissions(user) -> set[str]:
    if user.role == "admin":
        return {"*"}
    if user.permissions is None:
        return ROLE_PERMISSIONS.get(user.role, set())
    try:
        configured = json.loads(user.permissions)
        return {p for p in configured if isinstance(p, str)}
    except (TypeError, json.JSONDecodeError):
        return set()


def require_permission(user, permission: str) -> None:
    allowed = permissions(user)
    if "*" not in allowed and permission not in allowed:
        raise HTTPException(403, "Permission denied")


def scoped_employees(stmt, user):
    """Apply every configured account dimension; an unbound scoped role sees no rows."""
    if user.role == "sup":
        if not user.bound_supplier_id:
            return stmt.where(Employee.id == -1)
        stmt = stmt.where(Employee.supplier_id == user.bound_supplier_id)
    elif user.role == "wh":
        if not user.bound_warehouse:
            return stmt.where(Employee.id == -1)
        stmt = stmt.where(Employee.primary_warehouse == user.bound_warehouse)
    elif user.role in {"worker", "client"}:
        return stmt.where(Employee.id == -1)
    if user.bound_biz_line:
        stmt = stmt.where(Employee.biz_line == user.bound_biz_line)
    return stmt


def require_employee_access(db, employee_id: int, user, permission: str = "employees.read"):
    from sqlalchemy import select
    require_permission(user, permission)
    employee = db.scalar(scoped_employees(select(Employee).where(Employee.id == employee_id), user))
    if employee is None:
        raise HTTPException(404, "Employee not found")
    return employee
