"""
渊博579 HR V7 — System Settings (key/value, JSON-encoded values)
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    updated_by: Mapped[Optional[str]] = mapped_column(String(100))
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(),
                                                 onupdate=lambda: datetime.utcnow())
