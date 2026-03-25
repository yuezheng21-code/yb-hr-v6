from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ReferralRecordOut(BaseModel):
    id: int
    referral_no: str
    referrer_emp_id: int
    referrer_emp_no: str
    referrer_name: str
    referrer_grade: str
    referee_emp_id: Optional[int]
    referee_name: str
    referee_phone: Optional[str]
    referee_target_grade: str
    reward_tier: str
    status: str
    submitted_at: datetime
    verified_at: Optional[datetime]
    onboard_date: Optional[date]
    day14_confirmed: bool
    day14_confirmed_at: Optional[date]
    reward_onboard: float
    reward_month1: float
    reward_month3: float
    reward_month6: float
    reward_month12: float
    reward_batch_bonus: float
    reward_special_bonus: float
    reward_rank_multiplier: float
    reward_total_paid: float
    reward_total_pending: float
    is_scarce_position: bool
    is_off_season: bool
    is_cross_region: bool
    fraud_flag: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ReferralCreate(BaseModel):
    referee_name: str
    referee_phone: Optional[str] = None
    referee_target_grade: str
    is_scarce_position: bool = False
    is_off_season: bool = False
    is_cross_region: bool = False
    notes: Optional[str] = None
