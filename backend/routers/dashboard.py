"""
渊博579 HR V7 — Dashboard Router
"""
from __future__ import annotations
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.warehouse import Warehouse
from backend.models.timesheet import Timesheet
from backend.models.settlement import ProjectSettlement
from backend.models.referral import ReferralRecord
from backend.models.commission import CommissionRecord, CommissionMonthly
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _past_months(n: int) -> list[str]:
    """Return the last n month strings (YYYY-MM), oldest first (O(n) arithmetic)."""
    now = datetime.utcnow()
    cur_year, cur_month = now.year, now.month
    result = []
    for i in range(n - 1, -1, -1):
        total_months = cur_year * 12 + cur_month - 1 - i
        y, m = divmod(total_months, 12)
        result.append(f"{y:04d}-{m+1:02d}")
    return result


@router.get("/stats")
def dashboard_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_employees = db.scalar(select(func.count(Employee.id)).where(Employee.status == "active")) or 0
    total_suppliers = db.scalar(select(func.count(Supplier.id)).where(Supplier.status == "active")) or 0
    total_warehouses = db.scalar(select(func.count(Warehouse.id)).where(Warehouse.status == "active")) or 0

    # Pending timesheets (wh_pending + fin_pending)
    pending_timesheets = db.scalar(
        select(func.count(Timesheet.id)).where(
            Timesheet.approval_status.in_(["wh_pending", "fin_pending"])
        )
    ) or 0

    # Current month total hours (booked timesheets)
    now = datetime.utcnow()
    first_day = now.replace(day=1).date()
    current_month_hours = db.scalar(
        select(func.sum(Timesheet.hours)).where(
            Timesheet.approval_status == "booked",
            Timesheet.work_date >= first_day,
        )
    ) or 0.0

    return {
        "active_employees": active_employees,
        "total_suppliers": total_suppliers,
        "total_warehouses": total_warehouses,
        "pending_timesheets": pending_timesheets,
        "current_month_hours": round(float(current_month_hours), 1),
    }


@router.get("/charts")
def dashboard_charts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Chart data: monthly hours/amount trends + warehouse & biz_line distributions."""
    months = _past_months(6)

    monthly_hours = []
    monthly_amount = []
    for period in months:
        year, month = int(period[:4]), int(period[5:7])
        date_from = date(year, month, 1)
        date_to = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

        hours = db.scalar(
            select(func.coalesce(func.sum(Timesheet.hours), 0.0))
            .where(Timesheet.approval_status == "booked",
                   Timesheet.work_date >= date_from,
                   Timesheet.work_date < date_to)
        ) or 0.0
        amount = db.scalar(
            select(func.coalesce(func.sum(Timesheet.amount_total), 0.0))
            .where(Timesheet.approval_status == "booked",
                   Timesheet.work_date >= date_from,
                   Timesheet.work_date < date_to)
        ) or 0.0

        monthly_hours.append({"label": period[5:7] + "/" + period[2:4], "value": round(float(hours), 1)})
        monthly_amount.append({"label": period[5:7] + "/" + period[2:4], "value": round(float(amount), 2)})

    first_day = datetime.utcnow().replace(day=1).date()
    wh_rows = db.execute(
        select(Timesheet.warehouse_code, func.coalesce(func.sum(Timesheet.hours), 0.0).label("hours"))
        .where(Timesheet.approval_status == "booked", Timesheet.work_date >= first_day)
        .group_by(Timesheet.warehouse_code)
        .order_by(func.sum(Timesheet.hours).desc())
        .limit(10)
    ).all()
    warehouse_distribution = [{"label": r[0], "value": round(float(r[1]), 1)} for r in wh_rows]

    biz_rows = db.execute(
        select(Timesheet.biz_line, func.coalesce(func.sum(Timesheet.hours), 0.0).label("hours"))
        .where(Timesheet.approval_status == "booked", Timesheet.work_date >= first_day)
        .group_by(Timesheet.biz_line)
        .order_by(func.sum(Timesheet.hours).desc())
    ).all()
    biz_line_distribution = [{"label": r[0], "value": round(float(r[1]), 1)} for r in biz_rows]

    return {
        "monthly_hours": monthly_hours,
        "monthly_amount": monthly_amount,
        "warehouse_distribution": warehouse_distribution,
        "biz_line_distribution": biz_line_distribution,
    }


@router.get("/margin-analysis")
def margin_analysis(
    months: int = Query(3, ge=1, le=12),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gross margin analysis from project settlements for the past N months."""
    periods = _past_months(months)

    rows = db.scalars(
        select(ProjectSettlement)
        .where(ProjectSettlement.period.in_(periods))
        .order_by(ProjectSettlement.period.desc(), ProjectSettlement.warehouse_code)
    ).all()

    period_summary: dict = {}
    for r in rows:
        p = r.period
        if p not in period_summary:
            period_summary[p] = {"revenue": 0.0, "cost": 0.0, "profit": 0.0, "count": 0}
        period_summary[p]["revenue"] += r.client_revenue
        period_summary[p]["cost"] += r.total_labor_cost
        period_summary[p]["profit"] += r.gross_profit
        period_summary[p]["count"] += 1

    by_period = [
        {
            "period": p,
            "revenue": round(v["revenue"], 2),
            "cost": round(v["cost"], 2),
            "profit": round(v["profit"], 2),
            "margin": round(v["profit"] / v["revenue"] * 100, 1) if v["revenue"] > 0 else 0.0,
        }
        for p, v in sorted(period_summary.items())
    ]

    by_warehouse: dict = {}
    for r in rows:
        wh = r.warehouse_code
        if wh not in by_warehouse:
            by_warehouse[wh] = {"revenue": 0.0, "profit": 0.0}
        by_warehouse[wh]["revenue"] += r.client_revenue
        by_warehouse[wh]["profit"] += r.gross_profit

    by_warehouse_list = [
        {
            "warehouse": wh,
            "revenue": round(v["revenue"], 2),
            "profit": round(v["profit"], 2),
            "margin": round(v["profit"] / v["revenue"] * 100, 1) if v["revenue"] > 0 else 0.0,
        }
        for wh, v in sorted(by_warehouse.items(), key=lambda x: x[1]["profit"], reverse=True)
    ]

    return {
        "periods": periods,
        "by_period": by_period,
        "by_warehouse": by_warehouse_list,
        "has_data": len(rows) > 0,
    }


@router.get("/referral-summary")
def referral_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Referral program summary for dashboard."""
    total = db.scalar(select(func.count(ReferralRecord.id))) or 0
    active = db.scalar(
        select(func.count(ReferralRecord.id)).where(
            ReferralRecord.status.not_in(["cancelled", "completed", "submitted"])
        )
    ) or 0
    completed = db.scalar(
        select(func.count(ReferralRecord.id)).where(ReferralRecord.status == "completed")
    ) or 0
    total_paid = db.scalar(select(func.coalesce(func.sum(ReferralRecord.reward_total_paid), 0.0))) or 0.0
    total_pending = db.scalar(select(func.coalesce(func.sum(ReferralRecord.reward_total_pending), 0.0))) or 0.0

    now = datetime.utcnow()
    first_day = now.replace(day=1)
    this_month = db.scalar(
        select(func.count(ReferralRecord.id)).where(
            ReferralRecord.submitted_at >= first_day,
            ReferralRecord.status != "cancelled",
        )
    ) or 0

    return {
        "total": total,
        "active": active,
        "completed": completed,
        "this_month": this_month,
        "total_paid": round(float(total_paid), 2),
        "total_pending": round(float(total_pending), 2),
    }


@router.get("/commission-summary")
def commission_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Commission agreements summary for dashboard."""
    total = db.scalar(select(func.count(CommissionRecord.id))) or 0
    active = db.scalar(
        select(func.count(CommissionRecord.id)).where(CommissionRecord.status == "active")
    ) or 0
    total_paid = db.scalar(select(func.coalesce(func.sum(CommissionRecord.total_paid), 0.0))) or 0.0
    total_pending = db.scalar(select(func.coalesce(func.sum(CommissionRecord.total_pending), 0.0))) or 0.0

    tier_counts = {}
    for tier in ["bronze", "silver", "gold", "platinum"]:
        count = db.scalar(
            select(func.count(CommissionRecord.id)).where(
                CommissionRecord.status == "active",
                CommissionRecord.tier == tier,
            )
        ) or 0
        tier_counts[tier] = count

    return {
        "total": total,
        "active": active,
        "total_paid": round(float(total_paid), 2),
        "total_pending": round(float(total_pending), 2),
        "tier_breakdown": tier_counts,
    }


@router.get("/dispatch-summary")
def dispatch_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Dispatch demand + talent funnel summary for dashboard."""
    from backend.models.dispatch import DispatchDemand, TalentPool
    if user.role not in {"admin", "hr", "mgr", "fin"}:
        from fastapi import HTTPException
        raise HTTPException(403, "Forbidden")

    # Demand stats
    demand_status = db.execute(
        select(DispatchDemand.status, func.count(DispatchDemand.id).label("cnt"))
        .group_by(DispatchDemand.status)
    ).all()
    by_status = {r.status: r.cnt for r in demand_status}
    open_hc = db.scalar(
        select(func.coalesce(func.sum(DispatchDemand.headcount), 0))
        .where(DispatchDemand.status.in_(["open", "recruiting"]))
    ) or 0
    matched = db.scalar(
        select(func.coalesce(func.sum(DispatchDemand.matched_count), 0))
        .where(DispatchDemand.status.in_(["open", "recruiting", "filled"]))
    ) or 0
    fill_rate = round(matched / open_hc * 100, 1) if open_hc > 0 else 0.0

    # Talent funnel
    talent_status = db.execute(
        select(TalentPool.pool_status, func.count(TalentPool.id).label("cnt"))
        .group_by(TalentPool.pool_status)
    ).all()
    talent_by_status = {r.pool_status: r.cnt for r in talent_status}
    total_talent = sum(r.cnt for r in talent_status)

    return {
        "demand_by_status": by_status,
        "open_headcount": int(open_hc),
        "matched_count": int(matched),
        "fill_rate": fill_rate,
        "talent_total": total_talent,
        "talent_by_status": talent_by_status,
    }
