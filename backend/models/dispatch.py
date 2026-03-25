"""
渊博579 HR V7 — Dispatch Demand & Talent Pool Models
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class DispatchDemand(Base):
    __tablename__ = "dispatch_demands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    demand_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    biz_line: Mapped[Optional[str]] = mapped_column(String(10))
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    position: Mapped[Optional[str]] = mapped_column(String(30))
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    shift_pattern: Mapped[Optional[str]] = mapped_column(String(50))
    client_settlement_type: Mapped[Optional[str]] = mapped_column(String(20))
    client_rate: Mapped[Optional[float]] = mapped_column(Float)
    matched_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="open")
    # open / recruiting / filled / closed
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    # high / medium / low
    requester: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )


class TalentPool(Base):
    __tablename__ = "talent_pool"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    nationality: Mapped[Optional[str]] = mapped_column(String(50))
    source_type: Mapped[str] = mapped_column(String(10), default="own")
    # own / supplier
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    preferred_biz_line: Mapped[Optional[str]] = mapped_column(String(10))
    preferred_warehouses: Mapped[Optional[str]] = mapped_column(Text)  # JSON list
    position: Mapped[Optional[str]] = mapped_column(String(30))
    expected_rate: Mapped[Optional[float]] = mapped_column(Float)
    languages: Mapped[Optional[str]] = mapped_column(String(100))
    skills: Mapped[Optional[str]] = mapped_column(String(200))
    pool_status: Mapped[str] = mapped_column(String(20), default="available")
    # available / contacted / interviewing / hired / rejected
    match_score: Mapped[Optional[float]] = mapped_column(Float)
    referrer: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )
