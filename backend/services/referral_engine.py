"""
渊博579 HR V7 — Referral Engine

Business rules from: 员工推荐奖励计划 V2.0

Key rules:
- Referrer must be P1-P5, active, past probation (>3 months tenure)
- 6-month cooldown for re-referral of same person
- Rewards computed per tier + special bonuses + rank multiplier
- Fraud detection: >50% of referee leave within 3 months, or
  referee leaves within 7 days of milestone, or >5 referrals/month
- Batch bonus when same referrer has 3+, 5+, or 10+ referrals in same calendar month
- Rank upgrade: cumulative successful referrals ≥ threshold
"""
from __future__ import annotations
from datetime import date, datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.models.referral import ReferralRecord
from backend.models.employee import Employee
import backend.config as cfg

# Eligibility grade range for referral bonus (P6+ is management, excluded from bonus)
ELIGIBLE_REFERRER_GRADES = {"P1", "P2", "P3", "P4", "P5"}


def _grade_to_tier(grade: str) -> str:
    """Map target grade to reward_tier key in REFERRAL_REWARDS."""
    g = grade.upper()
    if g in {"P1", "P2", "P3", "P4"}:
        return "P1_P4"
    return g  # P5, P6, P7, P8, P9


def check_eligibility(referrer: Employee) -> Tuple[bool, str]:
    """
    Check if an employee can submit a referral.
    Returns (ok, reason).
    """
    if referrer.status != "active":
        return False, "推荐人不在职"
    if referrer.grade not in ELIGIBLE_REFERRER_GRADES:
        return False, f"推荐人职级 {referrer.grade} 不在奖励范围 (仅P1-P5)"
    # Check probation: join_date must be >3 months ago
    if referrer.join_date:
        min_join_date = date.today() - timedelta(days=90)
        if referrer.join_date > min_join_date:
            return False, "推荐人试用期未满 (需满3个月)"
    return True, "ok"


def check_cooldown(db: Session, referee_name: str, referee_phone: Optional[str]) -> Tuple[bool, str]:
    """
    Check if the referee was already referred in the past 6 months.
    """
    cutoff = datetime.utcnow() - timedelta(days=180)
    stmt = select(ReferralRecord).where(
        ReferralRecord.referee_name == referee_name,
        ReferralRecord.submitted_at >= cutoff,
        ReferralRecord.status.not_in(["cancelled"]),
    )
    existing = db.scalar(stmt)
    if existing:
        return False, f"被推荐人 {referee_name} 6个月内已被推荐 ({existing.referral_no})"
    return True, "ok"


def calculate_reward(record: ReferralRecord) -> ReferralRecord:
    """
    Calculate reward amounts for a referral record.
    Sets reward_onboard, reward_month1..12, reward_special_bonus, reward_rank_multiplier, reward_total_pending.
    """
    tier = record.reward_tier
    base = cfg.REFERRAL_REWARDS.get(tier, cfg.REFERRAL_REWARDS["P1_P4"])

    # Special bonuses
    special = 0.0
    if record.is_off_season:
        special += 50.0   # S2: €50
    if record.is_cross_region:
        special += 80.0   # S3: €80
    record.reward_special_bonus = round(special, 2)

    # S1: scarce position × 1.5 on onboard reward
    record.reward_onboard = round(base["onboard"] * (1.5 if record.is_scarce_position else 1.0), 2)
    record.reward_month1 = round(base["month1"], 2)
    record.reward_month3 = round(base["month3"], 2)
    record.reward_month6 = round(base["month6"], 2)
    record.reward_month12 = round(base["month12"], 2)

    raw_total = (
        record.reward_onboard + record.reward_month1 + record.reward_month3 +
        record.reward_month6 + record.reward_month12 +
        record.reward_special_bonus + record.reward_batch_bonus
    )
    total = round(raw_total * record.reward_rank_multiplier, 2)
    cap = base["max"] * 3.0
    total = min(total, cap)

    record.reward_total_pending = total
    return record


def calculate_batch_bonus(db: Session, referrer_id: int, month: str) -> float:
    """
    Calculate batch bonus for a referrer in a given calendar month.
    month: "2026-03"
    Returns extra bonus amount (not yet added to existing rewards).
    """
    year, mo = int(month[:4]), int(month[5:7])
    start = datetime(year, mo, 1)
    end = datetime(year + (1 if mo == 12 else 0), 1 if mo == 12 else mo + 1, 1)

    count = db.scalar(
        select(func.count(ReferralRecord.id)).where(
            ReferralRecord.referrer_emp_id == referrer_id,
            ReferralRecord.submitted_at >= start,
            ReferralRecord.submitted_at < end,
            ReferralRecord.status.not_in(["cancelled"]),
        )
    ) or 0

    bonus = 0
    for threshold in sorted(cfg.BATCH_BONUS.keys(), reverse=True):
        if count >= threshold:
            bonus = cfg.BATCH_BONUS[threshold]
            break
    return float(bonus)


def get_rank_multiplier(db: Session, referrer_id: int) -> float:
    """
    Get rank multiplier based on cumulative successful referrals.
    """
    total = db.scalar(
        select(func.count(ReferralRecord.id)).where(
            ReferralRecord.referrer_emp_id == referrer_id,
            ReferralRecord.status.in_(["day14_confirmed", "month1", "month3", "month6", "month12", "completed"]),
        )
    ) or 0

    multiplier = 1.0
    for threshold in sorted(cfg.RANK_THRESHOLDS.keys()):
        if total >= threshold:
            multiplier = cfg.RANK_THRESHOLDS[threshold]
    return multiplier


def check_milestone(record: ReferralRecord, milestone: str) -> Tuple[bool, str]:
    """
    Check if a milestone is ready to be confirmed.
    milestone: "day14" | "month1" | "month3" | "month6" | "month12"
    """
    if not record.onboard_date:
        return False, "尚未入职"

    today = date.today()
    deltas = {
        "day14": 14,
        "month1": 30,
        "month3": 91,
        "month6": 183,
        "month12": 365,
    }
    required_days = deltas.get(milestone, 0)
    if (today - record.onboard_date).days < required_days:
        return False, f"{milestone} 时间未到"
    return True, "ok"


def detect_anomaly(db: Session, referrer_id: int, month: str) -> dict:
    """
    Fraud detection report for a referrer in a given month.
    Returns dict with flags and details.
    """
    year, mo = int(month[:4]), int(month[5:7])
    start = datetime(year, mo, 1)
    end = datetime(year + (1 if mo == 12 else 0), 1 if mo == 12 else mo + 1, 1)

    month_referrals = db.scalars(
        select(ReferralRecord).where(
            ReferralRecord.referrer_emp_id == referrer_id,
            ReferralRecord.submitted_at >= start,
            ReferralRecord.submitted_at < end,
        )
    ).all()

    flags = []

    # Rule 1: >5 referrals per month
    if len(month_referrals) > 5:
        flags.append(f"单月推荐 {len(month_referrals)} 人 (上限5人)")

    # Rule 2: >50% of referees left within 3 months
    completed_3mo = [r for r in month_referrals if r.status in ("month3", "month6", "month12", "completed")]
    cancelled = [r for r in month_referrals if r.status == "cancelled"]
    if completed_3mo:
        leave_rate = len(cancelled) / len(completed_3mo)
        if leave_rate > 0.5:
            flags.append(f"推荐离职率 {leave_rate:.0%} >50%")

    return {
        "referrer_id": referrer_id,
        "month": month,
        "referral_count": len(month_referrals),
        "fraud_flags": flags,
        "is_anomaly": len(flags) > 0,
    }
