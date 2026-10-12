from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class WarehouseBase(BaseModel):
    code: str
    name: str
    zone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    clock_radius_m: int = 1000
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

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and not -90 <= value <= 90:
            raise ValueError("纬度必须在 -90 到 90 之间")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and not -180 <= value <= 180:
            raise ValueError("经度必须在 -180 到 180 之间")
        return value

    @field_validator("clock_radius_m")
    @classmethod
    def validate_clock_radius(cls, value: int) -> int:
        if not 50 <= value <= 10_000:
            raise ValueError("打卡半径必须在 50 到 10000 米之间")
        return value


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    zone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    clock_radius_m: Optional[int] = None
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

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and not -90 <= value <= 90:
            raise ValueError("纬度必须在 -90 到 90 之间")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and not -180 <= value <= 180:
            raise ValueError("经度必须在 -180 到 180 之间")
        return value

    @field_validator("clock_radius_m")
    @classmethod
    def validate_clock_radius(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and not 50 <= value <= 10_000:
            raise ValueError("打卡半径必须在 50 到 10000 米之间")
        return value


class WarehouseOut(WarehouseBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
