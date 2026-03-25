from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="worker")
    lang: Mapped[str] = mapped_column(String(5), default="zh")
    avatar_color: Mapped[str] = mapped_column(String(20), default="#4f6ef7")
    bound_supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True)
    bound_warehouse: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    bound_biz_line: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    pin: Mapped[Optional[str]] = mapped_column(String(4), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    last_login: Mapped[Optional[datetime]] = mapped_column(nullable=True)
