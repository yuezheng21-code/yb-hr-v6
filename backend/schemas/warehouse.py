from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WarehouseBase(BaseModel):
    code: str
    name: str
    zone: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    biz_line: Optional[str] = None
    client_settlement_type: Optional[str] = None
    rate_hourly: Optional[float] = None
    rate_load_20gp: Optional[float] = None
    rate_unload_20gp: Optional[float] = None
    rate_load_40gp: Optional[float] = None
    rate_unload_40gp: Optional[float] = None
    rate_45hc: Optional[float] = None
    status: str = "active"
    notes: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    manager: Optional[str] = None
    phone: Optional[str] = None
    biz_line: Optional[str] = None
    client_settlement_type: Optional[str] = None
    rate_hourly: Optional[float] = None
    rate_load_20gp: Optional[float] = None
    rate_unload_20gp: Optional[float] = None
    rate_load_40gp: Optional[float] = None
    rate_unload_40gp: Optional[float] = None
    rate_45hc: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class WarehouseOut(WarehouseBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
