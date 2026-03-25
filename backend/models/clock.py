from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class ClockEvent(Base):
    __tablename__ = "clock_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    emp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    clock_type: Mapped[str] = mapped_column(String(10), nullable=False)   # in/out
    clock_time: Mapped[str] = mapped_column(String(8), nullable=False)    # HH:MM:SS
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
