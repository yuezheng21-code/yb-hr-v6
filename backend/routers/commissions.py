"""
渊博579 HR V7 — Commissions Router
/api/v1/commissions
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.commission import CommissionRecord, CommissionMonthly
from backend.models.user import User
from backend.schemas.commission import CommissionRecordOut, CommissionMonthlyOut, CommissionCreate
from backend.middleware.auth import get_current_user
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services import commission_engine

router = APIRouter(prefix="/api/v1/commissions", tags=["commissions"])


def _next_com_no(db: Session) -> str:
    return next_sequence_no(db, CommissionRecord, CommissionRecord.commission_no, make_prefix("COM"))


@router.get("", response_model=list[CommissionRecordOut])
def list_commissions(
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(CommissionRecord).order_by(CommissionRecord.created_at.desc())
    if status:
        stmt = stmt.where(CommissionRecord.status == status)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("", response_model=CommissionRecordOut, status_code=201)
def create_commission(
    body: CommissionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    tier_info = commission_engine.get_tier_info(body.tier)
    record = CommissionRecord(
        commission_no=_next_com_no(db),
        referrer_name=body.referrer_name,
        referrer_type=body.referrer_type,
        referrer_contact=body.referrer_contact,
        referrer_iban=body.referrer_iban,
        referrer_tax_id=body.referrer_tax_id,
        client_name=body.client_name,
        client_warehouse=body.client_warehouse,
        contract_no=body.contract_no,
        contract_start=body.contract_start,
        tier=body.tier,
        commission_rate=tier_info["rate"] * 100,  # store as percent e.g. 3.0
        validity_months=tier_info["months"],
        first_payout_delay=tier_info["delay"],
        status="pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{commission_id}", response_model=CommissionRecordOut)
def update_commission(
    commission_id: int,
    tier: Optional[str] = Body(None, embed=True),
    status: Optional[str] = Body(None, embed=True),
    notes: Optional[str] = Body(None, embed=True),
    validity_start: Optional[str] = Body(None, embed=True),
    validity_end: Optional[str] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(CommissionRecord, commission_id)
    if not record:
        raise HTTPException(404, "Not found")
    if tier and tier != record.tier:
        tier_info = commission_engine.get_tier_info(tier)
        record.tier = tier
        record.commission_rate = tier_info["rate"] * 100
        record.validity_months = tier_info["months"]
        record.first_payout_delay = tier_info["delay"]
    if status:
        record.status = status
    if notes is not None:
        record.notes = notes
    if validity_start:
        record.validity_start = date.fromisoformat(validity_start)
    if validity_end:
        record.validity_end = date.fromisoformat(validity_end)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{commission_id}/monthly", response_model=list[CommissionMonthlyOut])
def get_monthly_details(
    commission_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    return db.scalars(
        select(CommissionMonthly)
        .where(CommissionMonthly.commission_id == commission_id)
        .order_by(CommissionMonthly.period.desc())
    ).all()


@router.post("/calculate/{period}")
def calculate_period(
    period: str,
    invoice_amounts: dict = Body(...),  # {commission_id: invoice_amount}
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate monthly commissions for a period.
    Body: {"1": 12000.0, "2": 35000.0}  (commission_id → invoice amount)
    """
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")

    results = []
    for commission_id_str, invoice_amount in invoice_amounts.items():
        record = db.get(CommissionRecord, int(commission_id_str))
        if not record or record.status not in ("active", "pending"):
            continue
        if record.status == "pending":
            record.status = "active"

        existing = db.scalar(
            select(CommissionMonthly).where(
                CommissionMonthly.commission_id == record.id,
                CommissionMonthly.period == period,
            )
        )
        if existing:
            results.append({"commission_no": record.commission_no, "status": "already_calculated"})
            continue

        cm = commission_engine.calculate_monthly(db, record, invoice_amount, period)

        # Check for tier upgrade/downgrade
        new_tier = commission_engine.check_upgrade(db, record)
        if new_tier:
            record.tier = new_tier
            tier_info = commission_engine.get_tier_info(new_tier)
            record.commission_rate = tier_info["rate"] * 100
        else:
            new_tier = commission_engine.check_downgrade(db, record)
            if new_tier:
                record.tier = new_tier
                tier_info = commission_engine.get_tier_info(new_tier)
                record.commission_rate = tier_info["rate"] * 100

        results.append({
            "commission_no": record.commission_no,
            "period": period,
            "invoice_amount": invoice_amount,
            "commission_amount": cm.commission_amount,
            "tier": record.tier,
        })

    db.commit()
    return {"period": period, "results": results}


@router.put("/monthly/{monthly_id}/pay", response_model=CommissionMonthlyOut)
def mark_monthly_paid(
    monthly_id: int,
    payment_date: Optional[str] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    cm = db.get(CommissionMonthly, monthly_id)
    if not cm:
        raise HTTPException(404, "Not found")
    if cm.payment_status == "paid":
        raise HTTPException(400, "Already paid")
    cm.payment_status = "paid"
    cm.payment_date = date.fromisoformat(payment_date) if payment_date else date.today()

    parent = db.get(CommissionRecord, cm.commission_id)
    if parent:
        parent.total_paid = round(parent.total_paid + cm.commission_amount, 2)
        parent.total_pending = round(max(0, parent.total_pending - cm.commission_amount), 2)

    db.commit()
    db.refresh(cm)
    return cm


@router.get("/{commission_id}", response_model=CommissionRecordOut)
def get_commission(
    commission_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    record = db.get(CommissionRecord, commission_id)
    if not record:
        raise HTTPException(404, "Not found")
    return record
