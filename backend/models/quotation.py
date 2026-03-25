"""
渊博579 HR V7 — Quotation & CostCalculation Models
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quote_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    client_name: Mapped[str] = mapped_column(String(100), nullable=False)
    client_contact: Mapped[Optional[str]] = mapped_column(String(100))
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    biz_line: Mapped[Optional[str]] = mapped_column(String(10))
    project_type: Mapped[Optional[str]] = mapped_column(String(30))
    # dispatch / werkvertrag / cross_docking
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # draft / sent / negotiating / accepted / rejected
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Cost breakdown (filled by cost calculator)
    cost_hourly_rate: Mapped[Optional[float]] = mapped_column(Float)     # gross hourly
    cost_social_rate: Mapped[Optional[float]] = mapped_column(Float)     # social %
    cost_management_fee: Mapped[Optional[float]] = mapped_column(Float)  # management %
    cost_total_per_hour: Mapped[Optional[float]] = mapped_column(Float)  # all-in cost

    # Quote
    quote_hourly_rate: Mapped[Optional[float]] = mapped_column(Float)    # suggested/negotiated rate
    quote_margin: Mapped[Optional[float]] = mapped_column(Float)         # target margin %

    # Line items (JSON)
    items_json: Mapped[Optional[str]] = mapped_column(Text)

    # Volume tier
    volume_tier: Mapped[Optional[str]] = mapped_column(String(10))       # tier1-4
    volume_discount: Mapped[Optional[float]] = mapped_column(Float, default=0.0)

    # Totals
    total_monthly_estimate: Mapped[Optional[float]] = mapped_column(Float)
    headcount_estimate: Mapped[Optional[int]] = mapped_column(Integer)
    avg_grade: Mapped[Optional[str]] = mapped_column(String(5))

    # Approval
    approved_by: Mapped[Optional[str]] = mapped_column(String(50))
    approved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )


class CostCalculation(Base):
    __tablename__ = "cost_calculations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    calc_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    quotation_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("quotations.id"), nullable=True, index=True)
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    project_type: Mapped[Optional[str]] = mapped_column(String(30))

    # Input
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    avg_grade: Mapped[str] = mapped_column(String(5), default="P1")
    monthly_hours_estimate: Mapped[Optional[float]] = mapped_column(Float)  # per person

    # Computed cost breakdown
    base_hourly: Mapped[float] = mapped_column(Float, default=0.0)
    grade_coefficient: Mapped[float] = mapped_column(Float, default=1.0)
    gross_hourly: Mapped[float] = mapped_column(Float, default=0.0)
    social_insurance_rate: Mapped[float] = mapped_column(Float, default=0.21)
    vacation_provision: Mapped[float] = mapped_column(Float, default=0.10)
    sick_leave_provision: Mapped[float] = mapped_column(Float, default=0.05)
    management_overhead: Mapped[float] = mapped_column(Float, default=0.08)
    equipment_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_cost_per_hour: Mapped[float] = mapped_column(Float, default=0.0)

    # Output
    target_margin: Mapped[float] = mapped_column(Float, default=0.20)
    suggested_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Monthly estimates
    monthly_revenue_estimate: Mapped[Optional[float]] = mapped_column(Float)
    monthly_cost_estimate: Mapped[Optional[float]] = mapped_column(Float)
    monthly_profit_estimate: Mapped[Optional[float]] = mapped_column(Float)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
