"""
渊博579 HR V7 — ArbZG Compliance & Zeitkonto Checker

德国《劳动时间法》(ArbZG) 核心规则:
- 每日最大工时: 10h (含加班), 通常上限 8h
- 每周最大工时: 48h
- 每日最小休息: 11h 连续
- 连续工作最长: 6天后必须休息
"""
from __future__ import annotations
from datetime import datetime, timedelta, date
from typing import Any


# ArbZG thresholds
ARBZG = {
    "daily_soft_limit":  8.0,   # standard working hours
    "daily_hard_limit":  10.0,  # absolute maximum
    "weekly_limit":      48.0,  # max hours per calendar week
    "rest_min_hours":    11.0,  # minimum rest between shifts
    "max_consecutive_days": 6,  # consecutive working days limit
}

# Zeitkonto thresholds
ZEITKONTO = {
    "max_positive_balance":  120.0,  # hours carry-over cap
    "max_negative_balance": -40.0,   # debt floor
    "alert_positive":         80.0,  # warn when balance > 80h
    "alert_negative":        -20.0,  # warn when balance < -20h
}


def check_daily_hours(date_str: str, hours: float) -> list[dict]:
    """Check a single day shift against ArbZG daily limits."""
    violations = []
    if hours > ARBZG["daily_hard_limit"]:
        violations.append({
            "type": "daily_hard_limit",
            "severity": "error",
            "date": date_str,
            "hours": hours,
            "limit": ARBZG["daily_hard_limit"],
            "message": f"{date_str}: {hours}h 超过每日上限 {ARBZG['daily_hard_limit']}h (ArbZG §3)",
        })
    elif hours > ARBZG["daily_soft_limit"]:
        violations.append({
            "type": "daily_soft_limit",
            "severity": "warning",
            "date": date_str,
            "hours": hours,
            "limit": ARBZG["daily_soft_limit"],
            "message": f"{date_str}: {hours}h 超过标准 {ARBZG['daily_soft_limit']}h (需补偿)",
        })
    return violations


def check_weekly_hours(week_label: str, weekly_total: float) -> list[dict]:
    """Check weekly total against ArbZG §3 limit."""
    violations = []
    if weekly_total > ARBZG["weekly_limit"]:
        violations.append({
            "type": "weekly_limit",
            "severity": "error",
            "week": week_label,
            "hours": weekly_total,
            "limit": ARBZG["weekly_limit"],
            "message": f"{week_label}: {weekly_total}h 超过周上限 {ARBZG['weekly_limit']}h (ArbZG §3)",
        })
    return violations


def check_rest_between_shifts(
    end_dt: datetime, next_start_dt: datetime
) -> list[dict]:
    """Check minimum 11h rest between two consecutive shifts (ArbZG §5)."""
    violations = []
    rest = (next_start_dt - end_dt).total_seconds() / 3600.0
    if rest < ARBZG["rest_min_hours"]:
        violations.append({
            "type": "rest_period",
            "severity": "error",
            "rest_hours": round(rest, 2),
            "limit": ARBZG["rest_min_hours"],
            "message": (
                f"班次间隔 {round(rest,2)}h 不足最低 {ARBZG['rest_min_hours']}h (ArbZG §5): "
                f"{end_dt.strftime('%Y-%m-%d %H:%M')} → {next_start_dt.strftime('%Y-%m-%d %H:%M')}"
            ),
        })
    return violations


def check_consecutive_days(worked_dates: list[str]) -> list[dict]:
    """Check that no employee works more than 6 consecutive days (ArbZG §9/§11)."""
    violations = []
    if not worked_dates:
        return violations
    parsed = sorted(set(datetime.strptime(d, "%Y-%m-%d").date() for d in worked_dates))
    streak = 1
    streak_start = parsed[0]
    for i in range(1, len(parsed)):
        if (parsed[i] - parsed[i - 1]).days == 1:
            streak += 1
        else:
            streak = 1
            streak_start = parsed[i]
        if streak > ARBZG["max_consecutive_days"]:
            violations.append({
                "type": "consecutive_days",
                "severity": "error",
                "streak": streak,
                "start_date": streak_start.isoformat(),
                "end_date": parsed[i].isoformat(),
                "limit": ARBZG["max_consecutive_days"],
                "message": (
                    f"连续工作 {streak} 天 (自 {streak_start}) 超过上限 "
                    f"{ARBZG['max_consecutive_days']} 天 (ArbZG §9)"
                ),
            })
    return violations


def check_zeitkonto_balance(employee_id: int, balance: float) -> list[dict]:
    """Check Zeitkonto balance against thresholds."""
    alerts = []
    if balance > ZEITKONTO["max_positive_balance"]:
        alerts.append({
            "type": "zeitkonto_overflow",
            "severity": "error",
            "employee_id": employee_id,
            "balance": balance,
            "limit": ZEITKONTO["max_positive_balance"],
            "message": f"员工#{employee_id} 时间账户余额 {balance}h 超过上限 {ZEITKONTO['max_positive_balance']}h",
        })
    elif balance > ZEITKONTO["alert_positive"]:
        alerts.append({
            "type": "zeitkonto_high",
            "severity": "warning",
            "employee_id": employee_id,
            "balance": balance,
            "threshold": ZEITKONTO["alert_positive"],
            "message": f"员工#{employee_id} 时间账户余额 {balance}h 较高，建议安排消化",
        })
    elif balance < ZEITKONTO["max_negative_balance"]:
        alerts.append({
            "type": "zeitkonto_underflow",
            "severity": "error",
            "employee_id": employee_id,
            "balance": balance,
            "limit": ZEITKONTO["max_negative_balance"],
            "message": f"员工#{employee_id} 时间账户余额 {balance}h 低于下限 {ZEITKONTO['max_negative_balance']}h",
        })
    elif balance < ZEITKONTO["alert_negative"]:
        alerts.append({
            "type": "zeitkonto_low",
            "severity": "warning",
            "employee_id": employee_id,
            "balance": balance,
            "threshold": ZEITKONTO["alert_negative"],
            "message": f"员工#{employee_id} 时间账户余额 {balance}h 偏低，请关注",
        })
    return alerts


def audit_employee_timesheet(
    timesheets: list[dict],
    employee_id: int | None = None,
    zeitkonto_balance: float | None = None,
) -> dict:
    """
    Full compliance audit for an employee's timesheets.

    Each timesheet dict: {
        "date": "YYYY-MM-DD",
        "hours": float,
        "start_time": "HH:MM" (optional),
        "end_time": "HH:MM" (optional),
    }

    Returns: {"violations": [...], "warnings": [...], "summary": {...}}
    """
    violations = []
    warnings = []

    # Daily checks
    worked_dates = []
    daily_totals: dict[str, float] = {}
    for ts in timesheets:
        d = ts.get("date", "")
        h = float(ts.get("hours", 0))
        daily_totals[d] = daily_totals.get(d, 0) + h
        worked_dates.append(d)

    for d, h in daily_totals.items():
        for v in check_daily_hours(d, h):
            if v["severity"] == "error":
                violations.append(v)
            else:
                warnings.append(v)

    # Weekly checks
    weekly_totals: dict[str, float] = {}
    for d, h in daily_totals.items():
        try:
            dt = datetime.strptime(d, "%Y-%m-%d")
            iso_year, iso_week, _ = dt.isocalendar()
            week_key = f"{iso_year}-W{iso_week:02d}"
            weekly_totals[week_key] = weekly_totals.get(week_key, 0) + h
        except ValueError:
            pass
    for wk, wh in weekly_totals.items():
        for v in check_weekly_hours(wk, wh):
            if v["severity"] == "error":
                violations.append(v)
            else:
                warnings.append(v)

    # Consecutive days
    for v in check_consecutive_days(worked_dates):
        if v["severity"] == "error":
            violations.append(v)
        else:
            warnings.append(v)

    # Zeitkonto
    if zeitkonto_balance is not None and employee_id is not None:
        for a in check_zeitkonto_balance(employee_id, zeitkonto_balance):
            if a["severity"] == "error":
                violations.append(a)
            else:
                warnings.append(a)

    return {
        "employee_id": employee_id,
        "total_days": len(set(worked_dates)),
        "total_hours": round(sum(daily_totals.values()), 2),
        "violations": violations,
        "warnings": warnings,
        "compliant": len(violations) == 0,
        "summary": {
            "daily_checks": len(daily_totals),
            "weekly_checks": len(weekly_totals),
            "violation_count": len(violations),
            "warning_count": len(warnings),
        },
    }
