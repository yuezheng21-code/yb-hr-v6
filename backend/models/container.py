from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class ContainerRecord(Base):
    __tablename__ = "container_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cn_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    container_no: Mapped[str] = mapped_column(String(30), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    warehouse_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")

    container_type: Mapped[str] = mapped_column(String(10), default="20GP")  # 20GP/40GP/45HC/LKW
    load_type: Mapped[str] = mapped_column(String(10), default="unload")     # load/unload

    group_no: Mapped[Optional[str]] = mapped_column(String(20))
    group_size: Mapped[int] = mapped_column(Integer, default=1)
    worker_ids: Mapped[Optional[str]] = mapped_column(Text)   # JSON array of employee IDs

    start_time: Mapped[Optional[str]] = mapped_column(String(5))
    end_time: Mapped[Optional[str]] = mapped_column(String(5))

    client_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    group_pay: Mapped[float] = mapped_column(Float, default=0.0)
    split_method: Mapped[str] = mapped_column(String(20), default="equal")   # equal/coefficient/hours

    is_split_to_timesheet: Mapped[bool] = mapped_column(Boolean, default=False)

    # Approval
    approval_status: Mapped[str] = mapped_column(String(20), default="pending")   # pending/wh_approved/fin_approved/rejected
    wh_approver: Mapped[Optional[str]] = mapped_column(String(100))
    wh_approved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    seal_no: Mapped[Optional[str]] = mapped_column(String(50))
    video_recorded: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
