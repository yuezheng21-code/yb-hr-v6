"""
渊博579 HR V7 — Quotations & Cost Calculations Router
/api/v1/quotations and /api/v1/cost-calculations
"""
from __future__ import annotations
import json
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.quotation import Quotation, CostCalculation
from backend.models.user import User
from backend.schemas.quotation import (
    QuotationOut, QuotationCreate, CostCalculationOut, CostCalcInput
)
from backend.middleware.auth import get_current_user
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services import cost_calculator, quotation_builder

router = APIRouter(prefix="/api/v1/quotations", tags=["quotations"])
cost_router = APIRouter(prefix="/api/v1/cost-calculations", tags=["cost-calculations"])


def _next_qt_no(db: Session) -> str:
    return next_sequence_no(db, Quotation, Quotation.quote_no, make_prefix("QT"))


def _next_cost_no(db: Session) -> str:
    return next_sequence_no(db, CostCalculation, CostCalculation.calc_no, make_prefix("COST"))


# ─── Quotations ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[QuotationOut])
def list_quotations(
    status: Optional[str] = Query(None),
    client_name: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(Quotation).order_by(Quotation.created_at.desc())
    if status:
        stmt = stmt.where(Quotation.status == status)
    if client_name:
        stmt = stmt.where(Quotation.client_name.ilike(f"%{client_name}%"))
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("", response_model=QuotationOut, status_code=201)
def create_quotation(
    body: QuotationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    q = Quotation(
        quote_no=_next_qt_no(db),
        client_name=body.client_name,
        client_contact=body.client_contact,
        warehouse_code=body.warehouse_code,
        biz_line=body.biz_line if hasattr(body, "biz_line") else None,
        project_type=body.project_type,
        valid_until=body.valid_until,
        headcount_estimate=body.headcount_estimate,
        avg_grade=body.avg_grade,
        notes=body.notes,
        status="draft",
        created_by=user.username,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.put("/{quotation_id}", response_model=QuotationOut)
def update_quotation(
    quotation_id: int,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "mgr", "fin"}:
        raise HTTPException(403, "Forbidden")
    q = db.get(Quotation, quotation_id)
    if not q:
        raise HTTPException(404, "Not found")
    allowed = {
        "client_name", "client_contact", "warehouse_code", "biz_line", "project_type",
        "status", "valid_until", "quote_hourly_rate", "quote_margin",
        "items_json", "volume_tier", "volume_discount", "total_monthly_estimate",
        "headcount_estimate", "avg_grade", "notes",
        "cost_hourly_rate", "cost_social_rate", "cost_management_fee", "cost_total_per_hour",
    }
    for k, v in body.items():
        if k in allowed:
            setattr(q, k, v)
    db.commit()
    db.refresh(q)
    return q


@router.post("/{quotation_id}/calculate-cost", response_model=CostCalculationOut)
def calculate_cost_for_quotation(
    quotation_id: int,
    body: CostCalcInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run cost calculator and link result to quotation."""
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    q = db.get(Quotation, quotation_id)
    if not q:
        raise HTTPException(404, "Quotation not found")

    calc_result = cost_calculator.calc_full(
        grade=body.avg_grade,
        headcount=body.headcount,
        monthly_hours_per_person=body.monthly_hours_estimate,
        target_margin=body.target_margin,
        equipment_cost=body.equipment_cost,
    )

    cc = CostCalculation(
        calc_no=_next_cost_no(db),
        quotation_id=quotation_id,
        warehouse_code=body.warehouse_code or q.warehouse_code,
        project_type=body.project_type or q.project_type,
        headcount=body.headcount,
        avg_grade=body.avg_grade,
        monthly_hours_estimate=body.monthly_hours_estimate,
        base_hourly=calc_result["base_hourly"],
        grade_coefficient=calc_result["grade_coefficient"],
        gross_hourly=calc_result["gross_hourly"],
        social_insurance_rate=calc_result["social_insurance_rate"],
        vacation_provision=calc_result["vacation_provision"],
        sick_leave_provision=calc_result["sick_leave_provision"],
        management_overhead=calc_result["management_overhead"],
        equipment_cost=calc_result["equipment_cost"],
        total_cost_per_hour=calc_result["total_cost_per_hour"],
        target_margin=calc_result["target_margin"],
        suggested_rate=calc_result["suggested_rate"],
        monthly_revenue_estimate=calc_result.get("monthly_revenue_estimate"),
        monthly_cost_estimate=calc_result.get("monthly_cost_estimate"),
        monthly_profit_estimate=calc_result.get("monthly_profit_estimate"),
        notes=body.notes,
        created_by=user.username,
    )
    db.add(cc)

    # Update quotation with cost data
    q.cost_hourly_rate = calc_result["gross_hourly"]
    q.cost_social_rate = calc_result["social_insurance_rate"]
    q.cost_management_fee = calc_result["management_overhead"]
    q.cost_total_per_hour = calc_result["total_cost_per_hour"]
    q.quote_hourly_rate = calc_result["suggested_rate"]
    q.quote_margin = calc_result["target_margin"]
    if body.headcount:
        q.headcount_estimate = body.headcount
    if body.avg_grade:
        q.avg_grade = body.avg_grade

    db.commit()
    db.refresh(cc)
    return cc


@router.put("/{quotation_id}/approve", response_model=QuotationOut)
def approve_quotation(
    quotation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve quotation. Amounts >€50k require admin role."""
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    q = db.get(Quotation, quotation_id)
    if not q:
        raise HTTPException(404, "Not found")
    # Large-value restriction (>€50k monthly)
    if q.total_monthly_estimate and q.total_monthly_estimate > 50000:
        if user.role != "admin":
            raise HTTPException(403, "月度报价超€50,000，需管理员审批")
    q.status = "accepted"
    q.approved_by = user.username
    q.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(q)
    return q


@router.get("/price-matrix")
def get_price_matrix(
    user: User = Depends(get_current_user),
):
    """Return v7.0 price matrix."""
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    return quotation_builder.get_price_matrix()


@router.post("/{quotation_id}/build-items")
def build_quote_items(
    quotation_id: int,
    items: list[dict] = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate quotation line items using the price matrix.
    Body: [{"biz_line": "9A", "volume": 80000}, ...]
    """
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    q = db.get(Quotation, quotation_id)
    if not q:
        raise HTTPException(404, "Not found")
    result = quotation_builder.build_quote_items(items)
    # Save items_json to quotation
    q.items_json = json.dumps(result["items"], ensure_ascii=False)
    q.total_monthly_estimate = result["total_brutto"]
    # Detect dominant tier
    tiers = [i.get("tier", "standard") for i in result["items"]]
    tier_rank = {"gold": 4, "silver": 3, "bronze": 2, "standard": 1}
    best = max(tiers, key=lambda t: tier_rank.get(t, 0)) if tiers else "standard"
    q.volume_tier = best
    discounts = [i.get("discount", 0.0) for i in result["items"] if i.get("discount", 0) > 0]
    q.volume_discount = max(discounts) if discounts else 0.0
    db.commit()
    return result


@router.get("/{quotation_id}/cost-calculations", response_model=list[CostCalculationOut])
def get_quotation_cost_calcs(
    quotation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    return db.scalars(
        select(CostCalculation)
        .where(CostCalculation.quotation_id == quotation_id)
        .order_by(CostCalculation.created_at.desc())
    ).all()


@router.get("/{quotation_id}", response_model=QuotationOut)
def get_quotation(
    quotation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    q = db.get(Quotation, quotation_id)
    if not q:
        raise HTTPException(404, "Not found")
    return q


# ─── Cost Calculations (standalone) ─────────────────────────────────────────

@cost_router.get("", response_model=list[CostCalculationOut])
def list_cost_calcs(
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    return db.scalars(
        select(CostCalculation)
        .order_by(CostCalculation.created_at.desc())
        .offset(skip).limit(limit)
    ).all()


@cost_router.post("", response_model=CostCalculationOut, status_code=201)
def create_cost_calc(
    body: CostCalcInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Standalone cost calculation (not linked to a quotation)."""
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    calc_result = cost_calculator.calc_full(
        grade=body.avg_grade,
        headcount=body.headcount,
        monthly_hours_per_person=body.monthly_hours_estimate,
        target_margin=body.target_margin,
        equipment_cost=body.equipment_cost,
    )
    cc = CostCalculation(
        calc_no=_next_cost_no(db),
        quotation_id=None,
        warehouse_code=body.warehouse_code,
        project_type=body.project_type,
        headcount=body.headcount,
        avg_grade=body.avg_grade,
        monthly_hours_estimate=body.monthly_hours_estimate,
        base_hourly=calc_result["base_hourly"],
        grade_coefficient=calc_result["grade_coefficient"],
        gross_hourly=calc_result["gross_hourly"],
        social_insurance_rate=calc_result["social_insurance_rate"],
        vacation_provision=calc_result["vacation_provision"],
        sick_leave_provision=calc_result["sick_leave_provision"],
        management_overhead=calc_result["management_overhead"],
        equipment_cost=calc_result["equipment_cost"],
        total_cost_per_hour=calc_result["total_cost_per_hour"],
        target_margin=calc_result["target_margin"],
        suggested_rate=calc_result["suggested_rate"],
        monthly_revenue_estimate=calc_result.get("monthly_revenue_estimate"),
        monthly_cost_estimate=calc_result.get("monthly_cost_estimate"),
        monthly_profit_estimate=calc_result.get("monthly_profit_estimate"),
        notes=body.notes,
        created_by=user.username,
    )
    db.add(cc)
    db.commit()
    db.refresh(cc)
    return cc


@cost_router.get("/grades-table")
def grades_table():
    """Return P1-P9 cost table for all grades (no auth - read-only public data)."""
    import backend.config as cfg
    rows = []
    for grade, coeff in cfg.COEFFICIENTS.items():
        r = cost_calculator.calc_full(grade=grade, target_margin=0.20)
        rows.append({
            "grade": grade,
            "gross_hourly": r["gross_hourly"],
            "total_cost_per_hour": r["total_cost_per_hour"],
            "suggested_rate_20pct": r["suggested_rate"],
        })
    return rows
