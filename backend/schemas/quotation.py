from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class QuotationOut(BaseModel):
    id: int
    quote_no: str
    client_name: str
    client_contact: Optional[str]
    warehouse_code: Optional[str]
    biz_line: Optional[str]
    project_type: Optional[str]
    status: str
    valid_until: Optional[date]
    cost_hourly_rate: Optional[float]
    cost_social_rate: Optional[float]
    cost_management_fee: Optional[float]
    cost_total_per_hour: Optional[float]
    quote_hourly_rate: Optional[float]
    quote_margin: Optional[float]
    items_json: Optional[str]
    volume_tier: Optional[str]
    volume_discount: Optional[float]
    total_monthly_estimate: Optional[float]
    headcount_estimate: Optional[int]
    avg_grade: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuotationCreate(BaseModel):
    client_name: str
    client_contact: Optional[str] = None
    warehouse_code: Optional[str] = None
    biz_line: Optional[str] = None
    project_type: Optional[str] = None
    valid_until: Optional[date] = None
    headcount_estimate: Optional[int] = None
    avg_grade: Optional[str] = None
    notes: Optional[str] = None


class CostCalculationOut(BaseModel):
    id: int
    calc_no: str
    quotation_id: Optional[int]
    warehouse_code: Optional[str]
    project_type: Optional[str]
    headcount: int
    avg_grade: str
    monthly_hours_estimate: Optional[float]
    base_hourly: float
    grade_coefficient: float
    gross_hourly: float
    social_insurance_rate: float
    vacation_provision: float
    sick_leave_provision: float
    management_overhead: float
    equipment_cost: float
    total_cost_per_hour: float
    target_margin: float
    suggested_rate: float
    monthly_revenue_estimate: Optional[float]
    monthly_cost_estimate: Optional[float]
    monthly_profit_estimate: Optional[float]
    notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CostCalcInput(BaseModel):
    """Input for cost calculation (both standalone and linked to quotation)."""
    headcount: int = 1
    avg_grade: str = "P1"
    target_margin: float = 0.20
    monthly_hours_estimate: Optional[float] = None
    equipment_cost: float = 0.0
    warehouse_code: Optional[str] = None
    project_type: Optional[str] = None
    notes: Optional[str] = None
