"""
渊博579 HR V7 — Referrals Router
/api/v1/referrals
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.referral import ReferralRecord
from backend.models.employee import Employee
from backend.models.user import User
from backend.schemas.referral import ReferralRecordOut, ReferralCreate
from backend.middleware.auth import get_current_user
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services import referral_engine

router = APIRouter(prefix="/api/v1/referrals", tags=["referrals"])


def _next_ref_no(db: Session) -> str:
    return next_sequence_no(db, ReferralRecord, ReferralRecord.referral_no, make_prefix("REF"))


@router.get("", response_model=list[ReferralRecordOut])
def list_referrals(
    status: Optional[str] = Query(None),
    referrer_emp_id: Optional[int] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(ReferralRecord).order_by(ReferralRecord.submitted_at.desc())
    if status:
        stmt = stmt.where(ReferralRecord.status == status)
    # Row-level: non-admin/hr users only see their own referrals
    if user.role not in {"admin", "hr", "fin", "mgr"}:
        emp = db.scalar(select(Employee).where(Employee.user_id == user.id))
        if emp:
            stmt = stmt.where(ReferralRecord.referrer_emp_id == emp.id)
        else:
            return []
    elif referrer_emp_id:
        stmt = stmt.where(ReferralRecord.referrer_emp_id == referrer_emp_id)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("", response_model=ReferralRecordOut, status_code=201)
def submit_referral(
    body: ReferralCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a new referral. Referrer must be a P1-P5 active employee."""
    referrer = db.scalar(select(Employee).where(Employee.user_id == user.id))
    if referrer is None:
        raise HTTPException(400, "当前账号未关联员工档案，无法提交推荐")

    ok, reason = referral_engine.check_eligibility(referrer)
    if not ok:
        raise HTTPException(400, reason)

    ok, reason = referral_engine.check_cooldown(db, body.referee_name, body.referee_phone)
    if not ok:
        raise HTTPException(400, reason)

    tier = referral_engine._grade_to_tier(body.referee_target_grade)
    multiplier = referral_engine.get_rank_multiplier(db, referrer.id)
    batch_bonus = referral_engine.calculate_batch_bonus(
        db, referrer.id, datetime.utcnow().strftime("%Y-%m")
    )

    record = ReferralRecord(
        referral_no=_next_ref_no(db),
        referrer_emp_id=referrer.id,
        referrer_emp_no=referrer.emp_no,
        referrer_name=referrer.name,
        referrer_grade=referrer.grade,
        referee_name=body.referee_name,
        referee_phone=body.referee_phone,
        referee_target_grade=body.referee_target_grade,
        reward_tier=tier,
        is_scarce_position=body.is_scarce_position,
        is_off_season=body.is_off_season,
        is_cross_region=body.is_cross_region,
        notes=body.notes,
        reward_rank_multiplier=multiplier,
        reward_batch_bonus=batch_bonus,
        status="submitted",
    )
    referral_engine.calculate_reward(record)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{referral_id}/verify", response_model=ReferralRecordOut)
def verify_referral(
    referral_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """HR pre-approval."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(ReferralRecord, referral_id)
    if not record:
        raise HTTPException(404, "Not found")
    if record.status != "submitted":
        raise HTTPException(400, "Only submitted referrals can be verified")
    record.status = "verified"
    record.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


@router.put("/{referral_id}/confirm-onboard", response_model=ReferralRecordOut)
def confirm_onboard(
    referral_id: int,
    onboard_date: str = Body(..., embed=True),
    referee_emp_id: Optional[int] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm referee has started employment."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(ReferralRecord, referral_id)
    if not record:
        raise HTTPException(404, "Not found")
    if record.status != "verified":
        raise HTTPException(400, "Only verified referrals can confirm onboard")
    record.onboard_date = date.fromisoformat(onboard_date)
    if referee_emp_id:
        record.referee_emp_id = referee_emp_id
    record.status = "onboarded"
    db.commit()
    db.refresh(record)
    return record


@router.put("/{referral_id}/confirm-day14", response_model=ReferralRecordOut)
def confirm_day14(
    referral_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """14-day confirmation — triggers onboard reward payout."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(ReferralRecord, referral_id)
    if not record:
        raise HTTPException(404, "Not found")
    if record.status != "onboarded":
        raise HTTPException(400, "Must be in onboarded status")

    ok, reason = referral_engine.check_milestone(record, "day14")
    if not ok:
        raise HTTPException(400, reason)

    record.day14_confirmed = True
    record.day14_confirmed_at = date.today()
    record.status = "day14_confirmed"
    record.reward_total_paid = round(record.reward_total_paid + record.reward_onboard, 2)
    record.reward_total_pending = round(record.reward_total_pending - record.reward_onboard, 2)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{referral_id}/confirm-milestone", response_model=ReferralRecordOut)
def confirm_milestone(
    referral_id: int,
    milestone: str = Body(..., embed=True),  # month1 | month3 | month6 | month12
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm a retention milestone and mark reward as paid."""
    if user.role not in {"admin", "hr", "fin"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(ReferralRecord, referral_id)
    if not record:
        raise HTTPException(404, "Not found")

    ok, reason = referral_engine.check_milestone(record, milestone)
    if not ok:
        raise HTTPException(400, reason)

    reward_map = {
        "month1": record.reward_month1,
        "month3": record.reward_month3,
        "month6": record.reward_month6,
        "month12": record.reward_month12,
    }
    amount = reward_map.get(milestone, 0.0)
    record.status = milestone
    record.reward_total_paid = round(record.reward_total_paid + amount, 2)
    record.reward_total_pending = round(max(0, record.reward_total_pending - amount), 2)
    if milestone == "month12":
        record.status = "completed"
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-milestones")
def check_milestones(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch check all pending referrals for milestone eligibility."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    active = db.scalars(
        select(ReferralRecord).where(
            ReferralRecord.status.in_(["onboarded", "day14_confirmed", "month1", "month3", "month6"])
        )
    ).all()

    status_to_next = {
        "onboarded": "day14",
        "day14_confirmed": "month1",
        "month1": "month3",
        "month3": "month6",
        "month6": "month12",
    }
    eligible = []
    for record in active:
        next_m = status_to_next.get(record.status)
        if next_m:
            ok, _ = referral_engine.check_milestone(record, next_m)
            if ok:
                eligible.append({"id": record.id, "referral_no": record.referral_no, "next_milestone": next_m})

    return {"eligible_count": len(eligible), "eligible": eligible}


@router.get("/my-stats")
def my_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Personal referral statistics."""
    emp = db.scalar(select(Employee).where(Employee.user_id == user.id))
    if not emp:
        return {"total": 0, "active": 0, "completed": 0, "total_paid": 0.0, "total_pending": 0.0, "rank_multiplier": 1.0}

    all_refs = db.scalars(
        select(ReferralRecord).where(ReferralRecord.referrer_emp_id == emp.id)
    ).all()
    multiplier = referral_engine.get_rank_multiplier(db, emp.id)
    return {
        "total": len(all_refs),
        "active": sum(1 for r in all_refs if r.status not in ("cancelled", "completed")),
        "completed": sum(1 for r in all_refs if r.status == "completed"),
        "total_paid": round(sum(r.reward_total_paid for r in all_refs), 2),
        "total_pending": round(sum(r.reward_total_pending for r in all_refs), 2),
        "rank_multiplier": multiplier,
    }


@router.get("/anomaly-report")
def anomaly_report(
    month: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fraud detection report for a month."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    period = month or datetime.utcnow().strftime("%Y-%m")

    year, mo = int(period[:4]), int(period[5:7])
    start = datetime(year, mo, 1)
    end = datetime(year + (1 if mo == 12 else 0), 1 if mo == 12 else mo + 1, 1)
    referrer_ids = db.scalars(
        select(ReferralRecord.referrer_emp_id).where(
            ReferralRecord.submitted_at >= start,
            ReferralRecord.submitted_at < end,
        ).distinct()
    ).all()

    reports = [referral_engine.detect_anomaly(db, rid, period) for rid in referrer_ids]
    anomalies = [r for r in reports if r["is_anomaly"]]
    return {"period": period, "total_checked": len(reports), "anomalies": anomalies}


@router.get("/payout-summary/{period}")
def payout_summary(
    period: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Monthly payout summary for finance."""
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")

    pending = db.scalars(
        select(ReferralRecord).where(
            ReferralRecord.reward_total_pending > 0,
            ReferralRecord.status.not_in(["submitted", "cancelled"]),
        )
    ).all()

    total_pending = sum(r.reward_total_pending for r in pending)
    return {
        "period": period,
        "pending_count": len(pending),
        "total_pending": round(total_pending, 2),
        "records": [
            {
                "referral_no": r.referral_no,
                "referrer_name": r.referrer_name,
                "referee_name": r.referee_name,
                "status": r.status,
                "reward_total_pending": r.reward_total_pending,
            }
            for r in pending
        ],
    }


@router.get("/{referral_id}", response_model=ReferralRecordOut)
def get_referral(
    referral_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.get(ReferralRecord, referral_id)
    if not record:
        raise HTTPException(404, "Not found")
    return record
