from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
import json
from pydantic import BaseModel, field_validator
from backend.models.user import ACCOUNT_CATEGORIES


class UserBase(BaseModel):
    username: str
    display_name: str
    role: str = "worker"
    account_category: str = "non_employee"
    lang: str = "zh"
    avatar_color: str = "#4f6ef7"
    bound_supplier_id: Optional[int] = None
    bound_warehouse: Optional[str] = None
    bound_biz_line: Optional[str] = None
    bound_zone: Optional[str] = None
    client_warehouses: Optional[str] = None
    permissions: Optional[list[str]] = None
    is_active: bool = True

    @field_validator("account_category")
    @classmethod
    def validate_account_category(cls, value: str) -> str:
        if value not in ACCOUNT_CATEGORIES:
            raise ValueError("无效的账号分类")
        return value


class UserCreate(UserBase):
    password: str
    employee_id: Optional[int] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    account_category: Optional[str] = None
    lang: Optional[str] = None
    avatar_color: Optional[str] = None
    bound_supplier_id: Optional[int] = None
    bound_warehouse: Optional[str] = None
    bound_biz_line: Optional[str] = None
    bound_zone: Optional[str] = None
    client_warehouses: Optional[str] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    employee_id: Optional[int] = None

    @field_validator("account_category")
    @classmethod
    def validate_account_category(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ACCOUNT_CATEGORIES:
            raise ValueError("无效的账号分类")
        return value


class UserOut(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("permissions", mode="before")
    @classmethod
    def parse_permissions(cls, value: Any):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return value


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginIn(BaseModel):
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str
