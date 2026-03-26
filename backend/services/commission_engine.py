"""
渊博579 HR V7 — Commission Engine

Business rules from: 推荐返佣方案 V1.0

Rules:
- Tier determined by 3-month rolling average of client invoice amount
- Instant upgrade if single month > 150% of current tier's upper limit
- Downgrade after 1 observation month below lower limit
- Monthly commission = invoice_amount × rate
- First payout delayed by first_payout_delay months
"""
from __future__ import annotations
from datetime import date, datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.models.commission import CommissionRecord, CommissionMonthly
import backend.config as cfg


def determine_tier(avg_monthly_invoice: float) -> str:
    """Determine commission tier from 3-month rolling average invoice amount."""
    for tier_name, tier_info in sorted(
        cfg.COMMISSION_TIERS.items(),
        key=lambda x: x[1]["min"],
        reverse=True,
    ):
        if avg_monthly_invoice >= tier_info["min"]:
            return tier_name
    return "bronze"


def get_tier_info(tier: str) -> dict:
    return cfg.COMMISSION_TIERS.get(tier, cfg.COMMISSION_TIERS["bronze"])


def check_upgrade(db: Session, record: CommissionRecord) -> Optional[str]:
    """
    Check if the record should be upgraded.
    - 3 consecutive months avg > current tier max → upgrade
    - Single month > 150% current tier max → instant upgrade
    Returns new tier name or None if no change.
    """
    recent = db.scalars(
        select(CommissionMonthly)
        .where(CommissionMonthly.commission_id == record.id)
        .order_by(CommissionMonthly.period.desc())
        .limit(3)
    ).all()
    if not recent:
        return None

    tier_info = get_tier_info(record.tier)
    max_amount = tier_info.get("max")
    if max_amount is None:
        return None  # already platinum

    # Instant upgrade: single month > 150% of max
    if any(r.client_invoice_amount > max_amount * 1.5 for r in recent):
        new_tier = determine_tier(recent[0].client_invoice_amount)
        if new_tier != record.tier:
            return new_tier

    # 3-month avg upgrade
    if len(recent) >= 3:
        avg = sum(r.client_invoice_amount for r in recent) / 3
        new_tier = determine_tier(avg)
        if new_tier != record.tier:
            return new_tier

    return None


def check_downgrade(db: Session, record: CommissionRecord) -> Optional[str]:
    """
    Check if the record should be downgraded.
    - 1 observation month below lower limit → downgrade
    Returns new tier name or None.
    """
    if record.tier == "bronze":
        return None

    recent = db.scalars(
        select(CommissionMonthly)
        .where(CommissionMonthly.commission_id == record.id)
        .order_by(CommissionMonthly.period.desc())
        .limit(1)
    ).all()
    if not recent:
        return None

    tier_info = get_tier_info(record.tier)
    min_amount = tier_info["min"]
    if recent[0].client_invoice_amount < min_amount:
        new_tier = determine_tier(recent[0].client_invoice_amount)
        if new_tier != record.tier:
            return new_tier
    return None


def _add_months(base_date: date, months: int) -> date:
    """Add a number of months to a date, clamping to valid day ranges."""
    total_month = base_date.month + months
    year = base_date.year + (total_month - 1) // 12
    month = ((total_month - 1) % 12) + 1
    return date(year, month, 1)


def calculate_monthly(
    db: Session,
    record: CommissionRecord,
    invoice_amount: float,
    period: str,
) -> CommissionMonthly:
    """
    Calculate and save the monthly commission for a period.
    Returns the CommissionMonthly record.
    """
    # Check if first payout delay applies
    delay = record.first_payout_delay or 0
    if record.validity_start and delay > 0:
        earliest_payout = _add_months(record.validity_start, delay)
        year, mo = int(period[:4]), int(period[5:7])
        period_date = date(year, mo, 1)
        if period_date < earliest_payout:
            cm = CommissionMonthly(
                commission_id=record.id,
                period=period,
                client_invoice_amount=round(invoice_amount, 2),
                commission_rate=record.commission_rate,
                commission_amount=0.0,
                payment_status="pending",
                notes="首次结算延迟期内",
            )
            db.add(cm)
            return cm

    amount = round(invoice_amount * record.commission_rate / 100, 2)
    cm = CommissionMonthly(
        commission_id=record.id,
        period=period,
        client_invoice_amount=round(invoice_amount, 2),
        commission_rate=record.commission_rate,
        commission_amount=amount,
        payment_status="pending",
    )
    db.add(cm)
    record.total_pending = round(record.total_pending + amount, 2)
    return cm
