"""
渊博579 HR V7 — ReferralRecord Model
员工推荐奖励记录
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class ReferralRecord(Base):
    __tablename__ = "referral_records"
    __table_args__ = (
        Index("ix_referral_period_referrer", "referrer_emp_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    referral_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)

    # Referrer info
    referrer_emp_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    referrer_emp_no: Mapped[str] = mapped_column(String(20), nullable=False)
    referrer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    referrer_grade: Mapped[str] = mapped_column(String(5), nullable=False)

    # Referee info
    referee_emp_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    referee_name: Mapped[str] = mapped_column(String(100), nullable=False)
    referee_phone: Mapped[Optional[str]] = mapped_column(String(30))
    referee_target_grade: Mapped[str] = mapped_column(String(5), nullable=False)
    reward_tier: Mapped[str] = mapped_column(String(10), nullable=False)  # P1_P4/P5/P6/P7/P8/P9

    # Status workflow
    status: Mapped[str] = mapped_column(String(20), default="submitted")
    # submitted → verified → onboarded → day14_confirmed → month1 → month3 → month6 → month12 → completed | cancelled

    # Key dates
    submitted_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    verified_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    onboard_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    day14_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    day14_confirmed_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Reward amounts (set by referral_engine.calculate_reward)
    reward_onboard: Mapped[float] = mapped_column(Float, default=0.0)
    reward_month1: Mapped[float] = mapped_column(Float, default=0.0)
    reward_month3: Mapped[float] = mapped_column(Float, default=0.0)
    reward_month6: Mapped[float] = mapped_column(Float, default=0.0)
    reward_month12: Mapped[float] = mapped_column(Float, default=0.0)
    reward_batch_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    reward_special_bonus: Mapped[float] = mapped_column(Float, default=0.0)
    reward_rank_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    reward_total_paid: Mapped[float] = mapped_column(Float, default=0.0)
    reward_total_pending: Mapped[float] = mapped_column(Float, default=0.0)

    # Special flags
    is_scarce_position: Mapped[bool] = mapped_column(Boolean, default=False)  # S1: ×1.5
    is_off_season: Mapped[bool] = mapped_column(Boolean, default=False)        # S2: +€50
    is_cross_region: Mapped[bool] = mapped_column(Boolean, default=False)      # S3: +€80
    fraud_flag: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )
