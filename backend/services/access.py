"""Permission and employee row-scope checks shared by personnel endpoints."""
from __future__ import annotations
import json
from fastapi import HTTPException
from sqlalchemy import select
from backend.models.employee import Employee
from backend.models.warehouse import Warehouse

ROLE_PERMISSIONS = {
    "admin": {"*"},
    "hr": {"employees.read", "employees.write", "employees.export", "personnel.read", "personnel.request", "personnel.approve", "changes.read", "changes.export"},
    "mgr": {"employees.read", "personnel.request", "personnel.approve", "changes.read", "changes.export"},
    "wh": {"employees.read", "changes.read"},
    "sup": {"employees.read", "employees.export", "changes.read", "changes.export"},
    "fin": {"employees.read"},
    "worker": set(),
    "client": set(),
}

APPROVAL_TYPES = {"leave", "salary", "termination"}


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


def approval_types(user) -> set[str]:
    """Return the personnel approval types this account may decide."""
    allowed = permissions(user)
    if "*" in allowed or "personnel.approve" in allowed:
        return set(APPROVAL_TYPES)
    return {approval_type for approval_type in APPROVAL_TYPES if f"personnel.approve.{approval_type}" in allowed}


def require_approval_permission(user, approval_type: str) -> None:
    if approval_type not in APPROVAL_TYPES or approval_type not in approval_types(user):
        raise HTTPException(403, "Permission denied")


def require_any_approval_permission(user) -> set[str]:
    allowed_types = approval_types(user)
    if not allowed_types:
        raise HTTPException(403, "Permission denied")
    return allowed_types


def scoped_employees(stmt, user):
    """Apply every configured account dimension; an unbound scoped role sees no rows."""
    if user.role in {"worker", "client"}:
        return stmt.where(Employee.id == -1)

    supplier_id = getattr(user, "bound_supplier_id", None)
    warehouse = getattr(user, "bound_warehouse", None)
    biz_line = getattr(user, "bound_biz_line", None)
    zone = getattr(user, "bound_zone", None)

    if user.role == "sup" and not supplier_id:
        return stmt.where(Employee.id == -1)
    if user.role == "wh" and not warehouse:
        return stmt.where(Employee.id == -1)

    if supplier_id:
        stmt = stmt.where(Employee.supplier_id == supplier_id)
    if warehouse:
        stmt = stmt.where(Employee.primary_warehouse == warehouse)
    if biz_line:
        stmt = stmt.where(Employee.biz_line == biz_line)
    if zone:
        stmt = stmt.where(Employee.primary_warehouse.in_(select(Warehouse.code).where(Warehouse.zone == zone)))
    return stmt


def scoped_employee_related(stmt, user, employee_id_column):
    """Restrict an employee-linked resource through the canonical employee scope."""
    return stmt.where(employee_id_column.in_(scoped_employees(select(Employee.id), user)))


def require_employee_assignment_scope(
    db,
    user,
    *,
    supplier_id: int | None,
    warehouse: str | None,
    biz_line: str | None,
) -> None:
    """Reject writes that assign an employee outside the caller's configured scope."""
    if user.role in {"worker", "client"}:
        raise HTTPException(403, "Permission denied")

    bound_supplier_id = getattr(user, "bound_supplier_id", None)
    bound_warehouse = getattr(user, "bound_warehouse", None)
    bound_biz_line = getattr(user, "bound_biz_line", None)
    bound_zone = getattr(user, "bound_zone", None)

    if user.role == "sup" and not bound_supplier_id:
        raise HTTPException(403, "Supplier account is not bound")
    if user.role == "wh" and not bound_warehouse:
        raise HTTPException(403, "Warehouse account is not bound")
    if bound_supplier_id and supplier_id != bound_supplier_id:
        raise HTTPException(403, "Supplier scope violation")
    if bound_warehouse and warehouse != bound_warehouse:
        raise HTTPException(403, "Warehouse scope violation")
    if bound_biz_line and biz_line != bound_biz_line:
        raise HTTPException(403, "Business-line scope violation")
    if bound_zone:
        if not warehouse or not db.scalar(select(Warehouse.code).where(Warehouse.code == warehouse, Warehouse.zone == bound_zone)):
            raise HTTPException(403, "Zone scope violation")


def require_employee_access(db, employee_id: int, user, permission: str = "employees.read"):
    from sqlalchemy import select
    require_permission(user, permission)
    employee = db.scalar(scoped_employees(select(Employee).where(Employee.id == employee_id), user))
    if employee is None:
        raise HTTPException(404, "Employee not found")
    return employee
