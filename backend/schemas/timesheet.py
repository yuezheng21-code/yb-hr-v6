from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class TimesheetBase(BaseModel):
    employee_id: int
    work_date: date
    warehouse_code: str
    start_time: Optional[str] = "08:00"
    end_time: Optional[str] = "16:00"
    hours: float = 0.0
    break_minutes: int = 0
    settlement_type: str = "hourly"
    base_rate: float = 0.0
    kpi_ratio: float = 0.0
    pieces: int = 0
    piece_rate: float = 0.0
    container_no: Optional[str] = None
    container_type: Optional[str] = None
    load_type: Optional[str] = None
    group_no: Optional[str] = None
    is_cross_warehouse: bool = False
    notes: Optional[str] = None


class TimesheetCreate(TimesheetBase):
    pass


class TimesheetUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    hours: Optional[float] = None
    break_minutes: Optional[int] = None
    settlement_type: Optional[str] = None
    base_rate: Optional[float] = None
    kpi_ratio: Optional[float] = None
    pieces: Optional[int] = None
    piece_rate: Optional[float] = None
    notes: Optional[str] = None


class TimesheetApproveIn(BaseModel):
    notes: Optional[str] = None


class TimesheetRejectIn(BaseModel):
    reason: str


class TimesheetOut(TimesheetBase):
    id: int
    ts_no: str
    emp_no: str
    emp_name: str
    emp_grade: Optional[str] = None
    source_type: str
    supplier_id: Optional[int]
    biz_line: str
    amount_hourly: float
    amount_piece: float
    amount_kpi: float
    amount_bonus: float
    amount_deduction: float
    amount_total: float
    approval_status: str
    wh_approver: Optional[str]
    wh_approved_at: Optional[datetime]
    fin_approver: Optional[str]
    fin_approved_at: Optional[datetime]
    reject_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
