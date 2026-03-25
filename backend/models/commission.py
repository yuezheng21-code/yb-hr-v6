"""
渊博579 HR V7 — Commission Models
合作伙伴返佣
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class CommissionRecord(Base):
    """Return-commission agreement with a client referrer."""
    __tablename__ = "commission_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    commission_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)

    # Referrer
    referrer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    referrer_type: Mapped[str] = mapped_column(String(20), nullable=False)  # individual/institution
    referrer_contact: Mapped[Optional[str]] = mapped_column(String(100))
    referrer_iban: Mapped[Optional[str]] = mapped_column(String(40))
    referrer_tax_id: Mapped[Optional[str]] = mapped_column(String(30))

    # Client
    client_name: Mapped[str] = mapped_column(String(100), nullable=False)
    client_warehouse: Mapped[Optional[str]] = mapped_column(String(10))
    contract_no: Mapped[Optional[str]] = mapped_column(String(50))
    contract_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Commission terms
    tier: Mapped[str] = mapped_column(String(20), nullable=False)            # bronze/silver/gold/platinum
    commission_rate: Mapped[float] = mapped_column(Float, nullable=False)    # 3/4/5/6 (%)
    validity_months: Mapped[Optional[int]] = mapped_column(Integer)
    validity_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    validity_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    first_payout_delay: Mapped[Optional[int]] = mapped_column(Integer)       # months

    # Status & totals
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/active/expired/terminated
    total_paid: Mapped[float] = mapped_column(Float, default=0.0)
    total_pending: Mapped[float] = mapped_column(Float, default=0.0)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class CommissionMonthly(Base):
    """Monthly commission calculation for a commission agreement."""
    __tablename__ = "commission_monthly"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    commission_id: Mapped[int] = mapped_column(Integer, ForeignKey("commission_records.id"), nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # "2026-03"
    client_invoice_amount: Mapped[float] = mapped_column(Float, default=0.0)
    commission_rate: Mapped[float] = mapped_column(Float, default=0.0)
    commission_amount: Mapped[float] = mapped_column(Float, default=0.0)
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/paid/disputed
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
