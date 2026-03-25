from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class SupplierBase(BaseModel):
    code: str
    name: str
    supplier_type: Optional[str] = None
    biz_line: Optional[str] = None
    contract_no: Optional[str] = None
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    settlement_cycle: str = "monthly"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "active"
    rating: Optional[str] = None
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    supplier_type: Optional[str] = None
    biz_line: Optional[str] = None
    contract_no: Optional[str] = None
    contract_start: Optional[date] = None
    contract_end: Optional[date] = None
    settlement_cycle: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[str] = None
    notes: Optional[str] = None


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
