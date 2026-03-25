"""
渊博579 HR V7 — Admin Management Router
/api/v1/admin/users           - User CRUD
/api/v1/admin/audit-logs      - Audit log viewer (uses legacy audit_logs table)
/api/v1/admin/system-config   - Business constants configuration
"""
from __future__ import annotations
import bcrypt
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserUpdate
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# ── System config stored in-memory (can be persisted to DB later) ─────────
_SYSTEM_CONFIG: dict = {
    "p1_hourly_rate": 13.90,
    "social_rate": 0.21,
    "vacation_rate": 0.10,
    "sick_rate": 0.05,
    "mgmt_overhead": 0.08,
    "default_margin": 0.20,
    "arbzg_daily_limit": 10.0,
    "arbzg_weekly_limit": 48.0,
    "zeitkonto_max_positive": 120.0,
    "zeitkonto_max_negative": -40.0,
    "session_timeout_minutes": 480,
    "company_name": "渊博579 GmbH",
    "company_timezone": "Europe/Berlin",
}

ROLES_ALLOWED = {"admin", "hr", "fin", "wh", "sup", "mgr", "worker"}


def _admin_only(user: User):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")


# ─── User Management ─────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    role: Optional[str] = Query(None),
    active_only: bool = Query(True),
    q: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    stmt = select(User).order_by(User.created_at.desc())
    if active_only:
        stmt = stmt.where(User.is_active == True)  # noqa: E712
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        stmt = stmt.where(User.username.ilike(f"%{q}%") | User.display_name.ilike(f"%{q}%"))
    rows = db.scalars(stmt.offset(skip).limit(limit)).all()
    return [_user_dict(u) for u in rows]


@router.post("/users", status_code=201)
def create_user(
    body: UserCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    if body.role not in ROLES_ALLOWED:
        raise HTTPException(400, f"Invalid role: {body.role}")
    existing = db.scalar(select(User).where(User.username == body.username))
    if existing:
        raise HTTPException(409, f"Username '{body.username}' already exists")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        username=body.username,
        password_hash=hashed,
        display_name=body.display_name,
        role=body.role,
        lang=body.lang,
        avatar_color=body.avatar_color,
        bound_supplier_id=body.bound_supplier_id,
        bound_warehouse=body.bound_warehouse,
        bound_biz_line=body.bound_biz_line,
        is_active=body.is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return _user_dict(new_user)


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    if body.role is not None and body.role not in ROLES_ALLOWED:
        raise HTTPException(400, f"Invalid role: {body.role}")
    update_data = body.model_dump(exclude_unset=True)
    raw_password = update_data.pop("password", None)
    for k, v in update_data.items():
        setattr(target, k, v)
    if raw_password:
        target.password_hash = bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    db.refresh(target)
    return _user_dict(target)


@router.delete("/users/{user_id}", status_code=204)
def deactivate_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    if user_id == user.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    target.is_active = False
    db.commit()


@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    new_pwd = body.get("new_password", "")
    if len(new_pwd) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    target.password_hash = bcrypt.hashpw(new_pwd.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "密码已重置"}


# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    table: Optional[str] = Query(None),
    skip: int = 0, limit: int = 500,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    # Use raw SQL to support both SQLite and PostgreSQL backends
    where_clauses = []
    params: dict = {}
    if action:
        where_clauses.append("action = :action")
        params["action"] = action
    if username:
        where_clauses.append("username LIKE :username")
        params["username"] = f"%{username}%"
    if table:
        where_clauses.append("target_table = :table")
        params["table"] = table
    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    params["limit"] = limit
    params["skip"] = skip
    try:
        result = db.execute(
            text(f"SELECT * FROM audit_logs {where_sql} ORDER BY created_at DESC LIMIT :limit OFFSET :skip"),
            params,
        ).mappings().all()
        return [dict(r) for r in result]
    except Exception:
        return []


# ─── System Config ────────────────────────────────────────────────────────────

@router.get("/system-config")
def get_system_config(
    user: User = Depends(get_current_user),
):
    _admin_only(user)
    return _SYSTEM_CONFIG.copy()


@router.put("/system-config")
def update_system_config(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
):
    _admin_only(user)
    allowed_keys = set(_SYSTEM_CONFIG.keys())
    updated = {}
    for k, v in body.items():
        if k in allowed_keys:
            _SYSTEM_CONFIG[k] = v
            updated[k] = v
    return {"updated": updated, "config": _SYSTEM_CONFIG.copy()}


# ─── Helper ───────────────────────────────────────────────────────────────────

def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "display_name": u.display_name,
        "role": u.role,
        "lang": u.lang,
        "avatar_color": u.avatar_color,
        "bound_supplier_id": u.bound_supplier_id,
        "bound_warehouse": u.bound_warehouse,
        "bound_biz_line": u.bound_biz_line,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }
