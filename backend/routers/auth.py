"""
渊博579 HR V7 — Auth Router
POST /api/v1/auth/login    — Login (username + password)
POST /api/v1/auth/pin      — Worker PIN login
GET  /api/v1/auth/me       — Current user info
PUT  /api/v1/auth/password — Change password
POST /api/v1/auth/refresh  — (placeholder)
"""
from __future__ import annotations
from datetime import datetime
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import LoginIn, PinLoginIn, TokenOut, UserOut, ChangePasswordIn
from backend.middleware.auth import create_access_token, get_current_user
from backend.services import login_guard

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _password_ok(user: User, password: str) -> bool:
    """bcrypt check that tolerates empty or non-bcrypt hashes left by older schemas."""
    if not user.password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode(), user.password_hash.encode())
    except ValueError:
        return False


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    key = f"pw:{login_guard.client_ip(request)}:{body.username.lower()}"
    login_guard.check(key)
    user = db.scalar(select(User).where(User.username == body.username))
    if user is None or not user.is_active or not _password_ok(user, body.password):
        login_guard.fail(key)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    login_guard.success(key)
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/pin", response_model=TokenOut)
def login_pin(body: PinLoginIn, request: Request, db: Session = Depends(get_db)):
    """Worker PIN login — looks up active worker user by their 4-digit PIN."""
    if not body.pin or len(body.pin) != 4:
        raise HTTPException(status_code=400, detail="请输入4位PIN")
    key = f"pin:{login_guard.client_ip(request)}"
    login_guard.check(key)
    user = db.scalar(
        select(User).where(User.pin == body.pin, User.role == "worker", User.is_active.is_(True))
    )
    if user is None:
        login_guard.fail(key)
        raise HTTPException(status_code=401, detail="PIN 错误或账号不存在")
    login_guard.success(key)
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.put("/password")
def change_password(
    body: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _password_ok(user, body.old_password):
        raise HTTPException(status_code=400, detail="旧密码错误")
    user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "密码已修改"}


@router.post("/refresh")
def refresh_token(user: User = Depends(get_current_user)):
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout():
    return {"message": "ok"}
