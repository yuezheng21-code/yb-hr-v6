"""
渊博579 HR V7 — AuditLog Model
Records user actions for the audit trail viewed in the Admin panel.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    user_display: Mapped[Optional[str]] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    target_table: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    target_id: Mapped[Optional[str]] = mapped_column(String(50))
    detail: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), index=True)
