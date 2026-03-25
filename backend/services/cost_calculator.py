"""
渊博579 HR V7 — Cost Calculator

业务规则:
- P1 基础时薪 €13.90 (MiLoG floor)
- P2-P9 时薪 = P1 × 职级系数
- 综合成本 = 时薪 × (1 + 21% + 10% + 5% + 8%) = 时薪 × 1.44
- 建议报价 = 综合成本 / (1 - 目标毛利率)
- 默认目标毛利率 20%
"""
from __future__ import annotations
import backend.config as cfg


def calc_hourly_cost(
    grade: str = "P1",
    social_rate: float | None = None,
    vacation_rate: float | None = None,
    sick_rate: float | None = None,
    mgmt_rate: float | None = None,
    equipment_cost: float = 0.0,
) -> dict:
    """
    Calculate all-in hourly cost for a given grade.
    Returns a dict with breakdown.
    """
    grade = grade.upper()
    coeff = cfg.COEFFICIENTS.get(grade, 1.0)
    gross = round(cfg.P1_HOURLY * coeff, 4)

    soc = social_rate if social_rate is not None else cfg.SOCIAL_RATE
    vac = vacation_rate if vacation_rate is not None else cfg.VACATION_RATE
    sick = sick_rate if sick_rate is not None else cfg.SICK_RATE
    mgmt = mgmt_rate if mgmt_rate is not None else cfg.MGMT_OVERHEAD

    social_abs = round(gross * soc, 4)
    vacation_abs = round(gross * vac, 4)
    sick_abs = round(gross * sick, 4)
    mgmt_abs = round(gross * mgmt, 4)

    total = round(gross + social_abs + vacation_abs + sick_abs + mgmt_abs + equipment_cost, 4)

    return {
        "grade": grade,
        "base_hourly": cfg.P1_HOURLY,
        "grade_coefficient": coeff,
        "gross_hourly": gross,
        "social_insurance_rate": soc,
        "vacation_provision": vac,
        "sick_leave_provision": sick,
        "management_overhead": mgmt,
        "equipment_cost": equipment_cost,
        "total_cost_per_hour": total,
    }


def suggest_quote(total_cost: float, target_margin: float = 0.20) -> float:
    """
    Calculate suggested quote rate.
    suggested_rate = total_cost / (1 - margin)
    """
    if target_margin >= 1.0 or target_margin < 0:
        raise ValueError("target_margin must be between 0 and 1 (exclusive)")
    return round(total_cost / (1.0 - target_margin), 2)


def calc_full(
    grade: str = "P1",
    headcount: int = 1,
    monthly_hours_per_person: float | None = None,
    target_margin: float = 0.20,
    equipment_cost: float = 0.0,
    **rate_overrides,
) -> dict:
    """
    Full cost calculation with monthly estimates.
    Returns complete breakdown dict ready to write to CostCalculation model.
    """
    breakdown = calc_hourly_cost(grade, equipment_cost=equipment_cost, **rate_overrides)
    suggested = suggest_quote(breakdown["total_cost_per_hour"], target_margin)

    result = {**breakdown, "target_margin": target_margin, "suggested_rate": suggested}

    if monthly_hours_per_person and monthly_hours_per_person > 0:
        total_hours = monthly_hours_per_person * headcount
        revenue = round(suggested * total_hours, 2)
        cost = round(breakdown["total_cost_per_hour"] * total_hours, 2)
        profit = round(revenue - cost, 2)
        result.update({
            "monthly_hours_estimate": monthly_hours_per_person,
            "monthly_revenue_estimate": revenue,
            "monthly_cost_estimate": cost,
            "monthly_profit_estimate": profit,
        })

    return result
