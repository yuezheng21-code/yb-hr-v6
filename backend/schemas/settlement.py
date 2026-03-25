from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class EmployeeSettlementOut(BaseModel):
    id: int
    settle_no: str
    period: str
    employee_id: int
    emp_no: str
    emp_name: str
    grade: str
    biz_line: str
    warehouse_code: str
    settlement_type: str
    timesheet_count: int
    total_hours: float
    total_pieces: int
    base_pay: float
    bonus_pay: float
    deduction: float
    gross_pay: float
    social_cost: float
    vacation_cost: float
    sick_cost: float
    mgmt_cost: float
    total_cost: float
    status: str
    confirmed_by: Optional[str]
    confirmed_at: Optional[datetime]
    paid_at: Optional[date]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SupplierSettlementOut(BaseModel):
    id: int
    settle_no: str
    period: str
    supplier_id: int
    supplier_name: str
    biz_line: str
    employee_count: int
    timesheet_count: int
    total_hours: float
    total_amount: float
    invoice_no: Optional[str]
    invoice_date: Optional[date]
    invoice_amount: float
    status: str
    paid_at: Optional[date]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectSettlementOut(BaseModel):
    id: int
    settle_no: str
    period: str
    warehouse_code: str
    biz_line: str
    client_revenue: float
    own_labor_cost: float
    supplier_labor_cost: float
    total_labor_cost: float
    gross_profit: float
    gross_margin: float
    status: str
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
