from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Timesheet(Base):
    __tablename__ = "timesheets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    # Employee reference
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    emp_no: Mapped[str] = mapped_column(String(20), nullable=False)
    emp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    emp_grade: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    # Row-level security fields
    source_type: Mapped[str] = mapped_column(String(10), default="own")  # own/supplier
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")

    # Work info
    work_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    warehouse_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    start_time: Mapped[Optional[str]] = mapped_column(String(5))   # "08:00"
    end_time: Mapped[Optional[str]] = mapped_column(String(5))     # "16:00"
    hours: Mapped[float] = mapped_column(Float, default=0.0)
    break_minutes: Mapped[int] = mapped_column(Integer, default=0)

    # Settlement
    settlement_type: Mapped[str] = mapped_column(String(20), default="hourly")  # hourly/piece/hourly_kpi/container
    base_rate: Mapped[float] = mapped_column(Float, default=0.0)
    kpi_ratio: Mapped[float] = mapped_column(Float, default=0.0)    # for hourly_kpi
    pieces: Mapped[int] = mapped_column(Integer, default=0)         # for piece
    piece_rate: Mapped[float] = mapped_column(Float, default=0.0)   # for piece

    # Amounts
    amount_hourly: Mapped[float] = mapped_column(Float, default=0.0)
    amount_piece: Mapped[float] = mapped_column(Float, default=0.0)
    amount_kpi: Mapped[float] = mapped_column(Float, default=0.0)
    amount_bonus: Mapped[float] = mapped_column(Float, default=0.0)    # shift bonus
    amount_deduction: Mapped[float] = mapped_column(Float, default=0.0)
    amount_total: Mapped[float] = mapped_column(Float, default=0.0)

    # Container reference (optional)
    container_no: Mapped[Optional[str]] = mapped_column(String(30))
    container_type: Mapped[Optional[str]] = mapped_column(String(10))  # 20GP/40GP/45HC/LKW
    load_type: Mapped[Optional[str]] = mapped_column(String(10))       # load/unload
    group_no: Mapped[Optional[str]] = mapped_column(String(20))
    is_cross_warehouse: Mapped[bool] = mapped_column(Boolean, default=False)

    # Approval flow: draft → wh_pending → fin_pending → booked | rejected
    approval_status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    wh_approver: Mapped[Optional[str]] = mapped_column(String(100))
    wh_approved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    fin_approver: Mapped[Optional[str]] = mapped_column(String(100))
    fin_approved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    reject_reason: Mapped[Optional[str]] = mapped_column(Text)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())
