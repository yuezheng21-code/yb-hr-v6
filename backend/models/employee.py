from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    nationality: Mapped[Optional[str]] = mapped_column(String(50))
    gender: Mapped[Optional[str]] = mapped_column(String(10))
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    id_type: Mapped[Optional[str]] = mapped_column(String(30))
    id_number: Mapped[Optional[str]] = mapped_column(String(50))
    source_type: Mapped[str] = mapped_column(String(10), nullable=False, default="own")
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    biz_line: Mapped[str] = mapped_column(String(10), default="渊博")
    department: Mapped[Optional[str]] = mapped_column(String(50))
    primary_warehouse: Mapped[Optional[str]] = mapped_column(String(10))
    secondary_warehouses: Mapped[Optional[str]] = mapped_column(Text)  # JSON array
    position: Mapped[Optional[str]] = mapped_column(String(30))
    grade: Mapped[str] = mapped_column(String(5), default="P1")
    settlement_type: Mapped[str] = mapped_column(String(20), default="hourly")
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float)
    languages: Mapped[Optional[str]] = mapped_column(String(100))
    skills: Mapped[Optional[str]] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="active")
    join_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    leave_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(30))
    social_security_no: Mapped[Optional[str]] = mapped_column(String(30))
    iban: Mapped[Optional[str]] = mapped_column(String(40))
    health_insurance: Mapped[Optional[str]] = mapped_column(String(50))
    whatsapp: Mapped[Optional[str]] = mapped_column(String(30))
    wechat: Mapped[Optional[str]] = mapped_column(String(50))
    referrer_emp_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())
