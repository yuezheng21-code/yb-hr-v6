from __future__ import annotations
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


class ContainerBase(BaseModel):
    container_no: str
    work_date: date
    warehouse_code: str
    biz_line: str = "渊博"
    container_type: str = "20GP"
    load_type: str = "unload"
    group_no: Optional[str] = None
    group_size: int = 1
    worker_ids: Optional[str] = None   # JSON string
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    client_revenue: float = 0.0
    group_pay: float = 0.0
    split_method: str = "equal"
    seal_no: Optional[str] = None
    notes: Optional[str] = None


class ContainerCreate(ContainerBase):
    pass


class ContainerUpdate(BaseModel):
    container_no: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    client_revenue: Optional[float] = None
    group_pay: Optional[float] = None
    split_method: Optional[str] = None
    video_recorded: Optional[bool] = None
    notes: Optional[str] = None


class ContainerApproveIn(BaseModel):
    end_time: Optional[str] = None
    video_recorded: bool = True


class ContainerOut(ContainerBase):
    id: int
    cn_no: str
    is_split_to_timesheet: bool
    approval_status: str
    wh_approver: Optional[str]
    wh_approved_at: Optional[datetime]
    video_recorded: bool
    created_at: datetime

    model_config = {"from_attributes": True}
