"""
渊博579 HR V7 — 财务：工资条、甲方客户与账单

Payslip   员工工资条（Entgeltabrechnung）：由已入账工时汇总；法定扣款（税/社保）由工资核算（DATEV）
          计算后录入或导入，系统不自行计算税额。签发后锁定并存入员工档案。
Customer  甲方客户主数据（开票抬头、税号、付款期限、DATEV 债务人科目、关联仓库）
Invoice   甲方账单（Rechnung）：草稿可编辑，开具后分配连续编号并锁定；作废通过红字发票（Storno）。
供应商结算单直接基于 settlements.SupplierSettlement + 工时明细生成，无单独表。
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (UniqueConstraint("period", "employee_id", name="uq_payslip_period_emp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slip_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # "2026-10"
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    emp_no: Mapped[str] = mapped_column(String(20), nullable=False)
    emp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # [{label, qty, unit, rate, amount}]
    earnings: Mapped[Optional[str]] = mapped_column(Text)
    gross: Mapped[float] = mapped_column(Float, default=0.0)
    # 法定扣款 {lst, soli, kist, kv, rv, av, pv}（工资核算结果）
    statutory: Mapped[Optional[str]] = mapped_column(Text)
    statutory_total: Mapped[float] = mapped_column(Float, default=0.0)
    statutory_source: Mapped[Optional[str]] = mapped_column(String(20))  # manual / import / none
    # 其他扣款 [{label, amount}]：工时单扣款、预支、实物…
    other_deductions: Mapped[Optional[str]] = mapped_column(Text)
    net: Mapped[float] = mapped_column(Float, default=0.0)
    payout: Mapped[float] = mapped_column(Float, default=0.0)
    total_hours: Mapped[float] = mapped_column(Float, default=0.0)
    work_days: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft / issued
    issued_by: Mapped[Optional[str]] = mapped_column(String(100))
    issued_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    document_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # employee_documents.id
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)            # 多行：街道 / 邮编 城市 / 国家
    country: Mapped[str] = mapped_column(String(2), default="DE")
    vat_id: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    contact: Mapped[Optional[str]] = mapped_column(String(100))
    payment_days: Mapped[Optional[int]] = mapped_column(Integer)
    reverse_charge: Mapped[bool] = mapped_column(Boolean, default=False)  # 欧盟其他国家 B2B：§ 13b 反向征收
    buyer_reference: Mapped[Optional[str]] = mapped_column(String(100))   # XRechnung BT-10 / Leitweg-ID
    warehouse_codes: Mapped[Optional[str]] = mapped_column(String(200))   # 逗号分隔
    datev_account: Mapped[Optional[str]] = mapped_column(String(10))      # 债务人科目（Debitor）
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_no: Mapped[Optional[str]] = mapped_column(String(30), unique=True, index=True)  # 开具时分配
    kind: Mapped[str] = mapped_column(String(10), default="invoice")  # invoice / storno
    cancels_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("invoices.id"), nullable=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    # 开具时的客户抬头快照（主数据之后修改不影响已开发票）
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_address: Mapped[Optional[str]] = mapped_column(Text)
    customer_vat_id: Mapped[Optional[str]] = mapped_column(String(30))
    period_from: Mapped[date] = mapped_column(Date, nullable=False)
    period_to: Mapped[date] = mapped_column(Date, nullable=False)
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # [{description, qty, unit, unit_price, amount, source, warehouse}]
    lines: Mapped[Optional[str]] = mapped_column(Text)
    net: Mapped[float] = mapped_column(Float, default=0.0)
    vat_rate: Mapped[float] = mapped_column(Float, default=0.19)
    vat: Mapped[float] = mapped_column(Float, default=0.0)
    gross: Mapped[float] = mapped_column(Float, default=0.0)
    reverse_charge: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)  # draft / issued / paid / cancelled
    paid_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    file_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 开具时的 PDF 存档（file_blobs）
    notes: Mapped[Optional[str]] = mapped_column(Text)        # 发票上显示的备注
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    issued_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())
