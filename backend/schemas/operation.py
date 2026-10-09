from __future__ import annotations
from datetime import date
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class OperationTypeIn(BaseModel):
    code: str
    name: str
    name_de: Optional[str] = None
    category: str = "other"
    unit: str = "件"
    client: Optional[str] = None
    warehouse_code: Optional[str] = None
    standard_uph: float = 0.0
    piece_rate: float = 0.0
    client_rate: float = 0.0
    keywords: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class OperationTypeUpdate(BaseModel):
    name: Optional[str] = None
    name_de: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    client: Optional[str] = None
    warehouse_code: Optional[str] = None
    standard_uph: Optional[float] = None
    piece_rate: Optional[float] = None
    client_rate: Optional[float] = None
    keywords: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class OperationLogIn(BaseModel):
    employee_id: int
    op_type_id: int
    work_date: date
    qty: float = Field(ge=0)
    error_qty: float = Field(default=0.0, ge=0)
    hours: float = Field(default=0.0, ge=0, le=24)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    warehouse_code: Optional[str] = None
    client: Optional[str] = None
    ref_no: Optional[str] = None
    notes: Optional[str] = None


class OperationLogUpdate(BaseModel):
    employee_id: Optional[int] = None
    op_type_id: Optional[int] = None
    work_date: Optional[date] = None
    qty: Optional[float] = Field(default=None, ge=0)
    error_qty: Optional[float] = Field(default=None, ge=0)
    hours: Optional[float] = Field(default=None, ge=0, le=24)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    warehouse_code: Optional[str] = None
    client: Optional[str] = None
    ref_no: Optional[str] = None
    notes: Optional[str] = None


class BatchEntry(BaseModel):
    employee_id: int
    qty: float = Field(ge=0)
    hours: float = Field(default=0.0, ge=0, le=24)
    error_qty: float = Field(default=0.0, ge=0)


class OperationBatchIn(BaseModel):
    """班组长一次录入：同一天、同一作业，多名员工"""
    op_type_id: int
    work_date: date
    warehouse_code: Optional[str] = None
    client: Optional[str] = None
    ref_no: Optional[str] = None
    entries: List[BatchEntry]


class IdsIn(BaseModel):
    ids: List[int]
    reason: Optional[str] = None


class SelfReportIn(BaseModel):
    """工人自助报工"""
    op_type_id: int
    qty: float = Field(gt=0)
    hours: float = Field(default=0.0, ge=0, le=24)
    ref_no: Optional[str] = None
    warehouse_code: Optional[str] = None


class StationScanIn(BaseModel):
    """扫码工位：扫员工工牌 + 作业条码 + 数量"""
    badge: str          # 工号 或 WMS账号
    op_code: str
    qty: float = Field(default=1.0, gt=0)
    ref_no: Optional[str] = None
    warehouse_code: Optional[str] = None


class SyncContainersIn(BaseModel):
    date_from: date
    date_to: date


class QualityEventIn(BaseModel):
    employee_id: int
    event_date: date
    event_type: str
    severity: str = "minor"
    qty: float = 1.0
    deduction: float = 0.0
    warehouse_code: Optional[str] = None
    client: Optional[str] = None
    ref_no: Optional[str] = None
    description: Optional[str] = None


class OperatorAliasIn(BaseModel):
    system: str = "*"
    alias: str
    employee_id: int


class IngestSourceIn(BaseModel):
    name: str
    system: str = "generic"
    default_warehouse: Optional[str] = None
    default_client: Optional[str] = None
    field_mapping: Optional[dict[str, Any]] = None
    auto_confirm: bool = False
    enabled: bool = True
    scopes: list[str] = ["ops:write"]


class IngestSourceUpdate(BaseModel):
    name: Optional[str] = None
    system: Optional[str] = None
    default_warehouse: Optional[str] = None
    default_client: Optional[str] = None
    field_mapping: Optional[dict[str, Any]] = None
    auto_confirm: Optional[bool] = None
    enabled: Optional[bool] = None
    scopes: Optional[list[str]] = None
