from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class UserBase(BaseModel):
    username: str
    display_name: str
    role: str = "worker"
    lang: str = "zh"
    avatar_color: str = "#4f6ef7"
    bound_supplier_id: Optional[int] = None
    bound_warehouse: Optional[str] = None
    bound_biz_line: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    lang: Optional[str] = None
    avatar_color: Optional[str] = None
    bound_supplier_id: Optional[int] = None
    bound_warehouse: Optional[str] = None
    bound_biz_line: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginIn(BaseModel):
    username: str
    password: str


class PinLoginIn(BaseModel):
    pin: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str
