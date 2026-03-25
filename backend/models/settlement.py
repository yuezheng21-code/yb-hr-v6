"""
渊博579 HR V7 — Settlement Models
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class EmployeeSettlement(Base):
    """Monthly settlement for direct (own) employees."""
    __tablename__ = "employee_settlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    settle_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)   # "2026-03"
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    emp_no: Mapped[str] = mapped_column(String(20), nullable=False)
    emp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    grade: Mapped[str] = mapped_column(String(5), default="P1")
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")
    warehouse_code: Mapped[str] = mapped_column(String(10), nullable=False)
    settlement_type: Mapped[str] = mapped_column(String(20), default="hourly")

    # Work summary
    timesheet_count: Mapped[int] = mapped_column(Integer, default=0)
    total_hours: Mapped[float] = mapped_column(Float, default=0.0)
    total_pieces: Mapped[int] = mapped_column(Integer, default=0)

    # Amounts
    base_pay: Mapped[float] = mapped_column(Float, default=0.0)      # sum(amount_hourly + amount_piece + amount_kpi)
    bonus_pay: Mapped[float] = mapped_column(Float, default=0.0)     # sum(amount_bonus)
    deduction: Mapped[float] = mapped_column(Float, default=0.0)     # sum(amount_deduction)
    gross_pay: Mapped[float] = mapped_column(Float, default=0.0)     # sum(amount_total) before deductions

    # Cost breakdown (calculated from gross)
    social_cost: Mapped[float] = mapped_column(Float, default=0.0)   # gross × 21%
    vacation_cost: Mapped[float] = mapped_column(Float, default=0.0) # gross × 10%
    sick_cost: Mapped[float] = mapped_column(Float, default=0.0)     # gross × 5%
    mgmt_cost: Mapped[float] = mapped_column(Float, default=0.0)     # gross × 8%
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)    # gross × 1.44

    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/confirmed/paid
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(100))
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    paid_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class SupplierSettlement(Base):
    """Monthly settlement for supplier-provided workers."""
    __tablename__ = "supplier_settlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    settle_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    supplier_name: Mapped[str] = mapped_column(String(100), nullable=False)
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")

    # Work summary
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    timesheet_count: Mapped[int] = mapped_column(Integer, default=0)
    total_hours: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)

    # Invoice
    invoice_no: Mapped[Optional[str]] = mapped_column(String(50))
    invoice_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    invoice_amount: Mapped[float] = mapped_column(Float, default=0.0)

    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/invoiced/paid
    paid_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class ProjectSettlement(Base):
    """Monthly gross profit analysis per warehouse / biz_line."""
    __tablename__ = "project_settlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    settle_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    warehouse_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")

    # Client revenue
    client_revenue: Mapped[float] = mapped_column(Float, default=0.0)   # from container_records

    # Our labor costs
    own_labor_cost: Mapped[float] = mapped_column(Float, default=0.0)     # total_cost from own employees
    supplier_labor_cost: Mapped[float] = mapped_column(Float, default=0.0) # invoices from suppliers

    total_labor_cost: Mapped[float] = mapped_column(Float, default=0.0)
    gross_profit: Mapped[float] = mapped_column(Float, default=0.0)
    gross_margin: Mapped[float] = mapped_column(Float, default=0.0)       # gross_profit / client_revenue

    status: Mapped[str] = mapped_column(String(20), default="draft")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
