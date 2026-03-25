from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    zone: Mapped[Optional[str]] = mapped_column(String(20))
    address: Mapped[Optional[str]] = mapped_column(String(200))
    manager: Mapped[Optional[str]] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    biz_line: Mapped[Optional[str]] = mapped_column(String(10))
    client_settlement_type: Mapped[Optional[str]] = mapped_column(String(20))
    rate_hourly: Mapped[Optional[float]] = mapped_column(Float)
    rate_load_20gp: Mapped[Optional[float]] = mapped_column(Float)
    rate_unload_20gp: Mapped[Optional[float]] = mapped_column(Float)
    rate_load_40gp: Mapped[Optional[float]] = mapped_column(Float)
    rate_unload_40gp: Mapped[Optional[float]] = mapped_column(Float)
    rate_45hc: Mapped[Optional[float]] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
