from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class CommissionRecordOut(BaseModel):
    id: int
    commission_no: str
    referrer_name: str
    referrer_type: str
    referrer_contact: Optional[str]
    referrer_iban: Optional[str]
    referrer_tax_id: Optional[str]
    client_name: str
    client_warehouse: Optional[str]
    contract_no: Optional[str]
    contract_start: Optional[date]
    tier: str
    commission_rate: float
    validity_months: Optional[int]
    validity_start: Optional[date]
    validity_end: Optional[date]
    first_payout_delay: Optional[int]
    status: str
    total_paid: float
    total_pending: float
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CommissionMonthlyOut(BaseModel):
    id: int
    commission_id: int
    period: str
    client_invoice_amount: float
    commission_rate: float
    commission_amount: float
    payment_status: str
    payment_date: Optional[date]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CommissionCreate(BaseModel):
    referrer_name: str
    referrer_type: str
    referrer_contact: Optional[str] = None
    referrer_iban: Optional[str] = None
    referrer_tax_id: Optional[str] = None
    client_name: str
    client_warehouse: Optional[str] = None
    contract_no: Optional[str] = None
    contract_start: Optional[date] = None
    tier: str
    notes: Optional[str] = None
