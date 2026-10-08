"""
渊博579 HR V7 — Admin Management Router
/api/v1/admin/users           - User CRUD
/api/v1/admin/audit-logs      - Audit log viewer (uses legacy audit_logs table)
/api/v1/admin/system-config   - Business constants configuration
/api/v1/admin/overview        - Admin dashboard (users, activity, data, health checks)
"""
from __future__ import annotations
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, text, func
from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import UserCreate, UserUpdate
from backend.middleware.auth import get_current_user
import backend.config as cfg
import backend.database as database

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


def _validate_pin(db: Session, pin: Optional[str], exclude_id: Optional[int] = None) -> Optional[str]:
    """Empty string clears the PIN; otherwise must be 4 unique digits."""
    if pin is None:
        return None
    pin = pin.strip()
    if pin == "":
        return ""
    if not (len(pin) == 4 and pin.isdigit()):
        raise HTTPException(400, "PIN 必须是 4 位数字")
    stmt = select(User.id).where(User.pin == pin)
    if exclude_id:
        stmt = stmt.where(User.id != exclude_id)
    if db.scalar(stmt):
        raise HTTPException(409, "PIN 已被其他用户使用")
    return pin


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
    if len(body.password) < 6:
        raise HTTPException(400, "密码至少 6 位")
    pin = _validate_pin(db, body.pin)
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        pin=pin or None,
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
    if user_id == user.id and (body.is_active is False or (body.role is not None and body.role != "admin")):
        raise HTTPException(400, "不能停用自己或修改自己的管理员角色")
    update_data = body.model_dump(exclude_unset=True)
    raw_password = update_data.pop("password", None)
    if raw_password and len(raw_password) < 6:
        raise HTTPException(400, "密码至少 6 位")
    if "pin" in update_data:
        pin = _validate_pin(db, update_data.pop("pin"), exclude_id=user_id)
        if pin is not None:
            target.pin = pin or None
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


# ─── Admin Dashboard ──────────────────────────────────────────────────────────

def _count(db: Session, stmt) -> int:
    try:
        return int(db.scalar(stmt) or 0)
    except Exception:
        db.rollback()
        return 0


@router.get("/overview")
def admin_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """后台看板：账号概况、活跃度、数据概况、待办、系统健康检查。"""
    _admin_only(user)
    from backend.models.employee import Employee
    from backend.models.supplier import Supplier
    from backend.models.warehouse import Warehouse
    from backend.models.timesheet import Timesheet
    from backend.models.operation import OperationLog, IngestSource

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    users = db.scalars(select(User)).all()
    active = [u for u in users if u.is_active]

    by_role: dict = {}
    for u in active:
        by_role[u.role] = by_role.get(u.role, 0) + 1

    recent_logins = sorted((u for u in users if u.last_login), key=lambda u: u.last_login, reverse=True)[:8]

    # Audit activity: last 7 days per day + latest entries
    activity = {(now.date() - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}
    recent_actions: list = []
    try:
        rows = db.execute(text(
            "SELECT username, user_display, action, target_table, target_id, detail, created_at "
            "FROM audit_logs ORDER BY created_at DESC LIMIT 300"
        )).mappings().all()
        for r in rows:
            ts = r["created_at"]
            d = (ts if isinstance(ts, datetime) else datetime.fromisoformat(str(ts)[:19])).date().isoformat() if ts else None
            if d in activity:
                activity[d] += 1
        recent_actions = [{**dict(r), "created_at": str(r["created_at"])[:19]} for r in rows[:8]]
    except Exception:
        db.rollback()

    # Configuration issues
    employee_names = {n for (n,) in db.execute(select(Employee.name).where(Employee.status == "active")).all()}
    sup_unbound = [u.username for u in active if u.role == "sup" and not u.bound_supplier_id]
    wh_unbound = [u.username for u in active if u.role == "wh" and not u.bound_warehouse]
    worker_unlinked = [u.username for u in active if u.role == "worker" and u.display_name not in employee_names]
    never_logged = [u.username for u in active if not u.last_login]

    admin_default_pw = False
    admin = next((u for u in users if u.username == "admin"), None)
    if admin and admin.is_active:
        try:
            admin_default_pw = bcrypt.checkpw(b"admin123", admin.password_hash.encode())
        except ValueError:
            pass

    checks = [
        {"key": "database", "ok": not database._is_sqlite,
         "label": "生产数据库", "detail": "PostgreSQL" if not database._is_sqlite else "当前为 SQLite，仅适合本地开发"},
        {"key": "jwt", "ok": bool(os.environ.get("JWT_SECRET")),
         "label": "JWT 密钥", "detail": "已配置" if os.environ.get("JWT_SECRET") else "未设置 JWT_SECRET，重启后所有登录失效"},
        {"key": "cors", "ok": cfg.CORS_ORIGINS != ["*"],
         "label": "跨域限制", "detail": ", ".join(cfg.CORS_ORIGINS) if cfg.CORS_ORIGINS != ["*"] else "CORS_ORIGINS 为 *（允许任意来源）"},
        {"key": "admin_pw", "ok": not admin_default_pw,
         "label": "管理员密码", "detail": "admin 仍在使用默认密码 admin123" if admin_default_pw else "已修改默认密码"},
        {"key": "sup_bind", "ok": not sup_unbound,
         "label": "供应商账号绑定", "detail": f"未绑定供应商：{', '.join(sup_unbound)}" if sup_unbound else "全部已绑定"},
        {"key": "wh_bind", "ok": not wh_unbound,
         "label": "仓管账号绑定", "detail": f"未绑定仓库：{', '.join(wh_unbound)}" if wh_unbound else "全部已绑定"},
        {"key": "worker_link", "ok": not worker_unlinked,
         "label": "工人账号关联员工", "detail": f"显示名称未匹配到在职员工：{', '.join(worker_unlinked)}" if worker_unlinked else "全部已关联"},
    ]

    data = {
        "employees": _count(db, select(func.count(Employee.id)).where(Employee.status == "active")),
        "suppliers": _count(db, select(func.count(Supplier.id)).where(Supplier.status == "active")),
        "warehouses": _count(db, select(func.count(Warehouse.id)).where(Warehouse.status == "active")),
        "timesheets_pending": _count(db, select(func.count(Timesheet.id)).where(
            Timesheet.approval_status.in_(["wh_pending", "fin_pending"]))),
        "ops_pending": _count(db, select(func.count(OperationLog.id)).where(OperationLog.status == "pending")),
        "ops_unmatched": _count(db, select(func.count(OperationLog.id)).where(OperationLog.status == "unmatched")),
        "ingest_sources": _count(db, select(func.count(IngestSource.id)).where(IngestSource.enabled == True)),  # noqa: E712
    }

    return {
        "users": {
            "total": len(users),
            "active": len(active),
            "inactive": len(users) - len(active),
            "active_7d": sum(1 for u in active if u.last_login and u.last_login >= week_ago),
            "never_logged_in": len(never_logged),
            "by_role": by_role,
        },
        "recent_logins": [{"id": u.id, "username": u.username, "display_name": u.display_name, "role": u.role,
                           "avatar_color": u.avatar_color, "last_login": u.last_login.isoformat()}
                          for u in recent_logins],
        "activity": [{"date": d, "count": c} for d, c in activity.items()],
        "recent_actions": recent_actions,
        "data": data,
        "checks": checks,
        "system": {"version": "7.0.0", "database": "SQLite" if database._is_sqlite else "PostgreSQL",
                   "company": _SYSTEM_CONFIG.get("company_name"), "server_time": now.isoformat()},
    }


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
        "pin": u.pin,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }
