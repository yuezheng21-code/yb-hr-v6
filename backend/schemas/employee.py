from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class EmployeeBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    source_type: str = "own"
    supplier_id: Optional[int] = None
    biz_line: str = "渊博"
    department: Optional[str] = None
    primary_warehouse: Optional[str] = None
    secondary_warehouses: Optional[str] = None
    position: Optional[str] = None
    grade: str = "P1"
    settlement_type: str = "hourly"
    hourly_rate: Optional[float] = None
    languages: Optional[str] = None
    skills: Optional[str] = None
    status: str = "active"
    join_date: Optional[date] = None
    leave_date: Optional[date] = None
    health_insurance: Optional[str] = None
    whatsapp: Optional[str] = None
    wechat: Optional[str] = None
    referrer_emp_id: Optional[int] = None
    tax_mode: Optional[str] = None   # 我方报税 / 供应商报税
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pin: Optional[str] = None   # 4-digit worker PIN — auto-creates a linked User account


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    source_type: Optional[str] = None
    supplier_id: Optional[int] = None
    biz_line: Optional[str] = None
    department: Optional[str] = None
    primary_warehouse: Optional[str] = None
    position: Optional[str] = None
    grade: Optional[str] = None
    settlement_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    join_date: Optional[date] = None
    leave_date: Optional[date] = None
    notes: Optional[str] = None
    tax_id: Optional[str] = None
    social_security_no: Optional[str] = None
    iban: Optional[str] = None
    tax_mode: Optional[str] = None
    pin: Optional[str] = None   # 4-digit worker PIN — updates / creates linked User account


class EmployeeOut(EmployeeBase):
    id: int
    emp_no: str
    created_at: datetime
    updated_at: datetime
    tax_id: Optional[str] = None
    social_security_no: Optional[str] = None
    iban: Optional[str] = None

    model_config = {"from_attributes": True}
