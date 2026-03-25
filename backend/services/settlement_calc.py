"""
渊博579 HR V7 — Settlement Calculation Engine

Business rules:
  hourly:      amount = base_rate × hours
  piece:       amount = piece_rate × pieces
  hourly_kpi:  amount = base_rate × hours × (1 + kpi_ratio)
  container:   amount = group_pay / group_size (equal) or by coefficient/hours

Shift bonuses (on top of base):
  Night   (22:00–06:00): +25%
  Weekend (Sat/Sun):     +50%
  Holiday:               +100%   (stored in is_holiday flag)
"""
from __future__ import annotations
from datetime import date


def _time_to_minutes(t: str) -> int:
    """'HH:MM' → minutes from midnight."""
    try:
        h, m = t.split(":")
        return int(h) * 60 + int(m)
    except Exception:
        return 0


def calc_shift_bonus_rate(work_date: date, start_time: str = "08:00", end_time: str = "16:00",
                          is_holiday: bool = False) -> float:
    """
    Returns additional bonus rate (0.0 = no bonus, 0.25 = +25%, etc.).
    Weekend and night bonuses stack (e.g. Saturday night = +75%).
    Holiday takes precedence over all other bonuses and returns +100% immediately.
    """
    bonus = 0.0
    if is_holiday:
        bonus += 1.0   # +100%
        return bonus   # holiday always highest — skip others

    weekday = work_date.weekday()   # 0=Mon, 6=Sun
    if weekday >= 5:   # Saturday or Sunday
        bonus += 0.5   # +50%

    # Night shift: any overlap with 22:00-06:00 (next day)
    start_m = _time_to_minutes(start_time)
    end_m = _time_to_minutes(end_time)
    # Treat end < start as overnight
    if end_m <= start_m:
        end_m += 24 * 60
    night_start = 22 * 60           # 22:00
    night_end = 6 * 60 + 24 * 60   # 06:00 next day = 30*60
    overlap = min(end_m, night_end) - max(start_m, night_start)
    if overlap > 0:
        bonus += 0.25  # +25%

    return bonus


def compute_hours(start_time: str, end_time: str, break_minutes: int = 0) -> float:
    """Compute effective work hours from start/end times."""
    start_m = _time_to_minutes(start_time)
    end_m = _time_to_minutes(end_time)
    if end_m <= start_m:
        end_m += 24 * 60  # overnight shift
    net_minutes = end_m - start_m - break_minutes
    return round(max(0.0, net_minutes / 60), 2)


def calc_settlement(
    settlement_type: str,
    hours: float,
    base_rate: float,
    kpi_ratio: float = 0.0,
    pieces: int = 0,
    piece_rate: float = 0.0,
    group_pay: float = 0.0,
    group_size: int = 1,
    shift_bonus_rate: float = 0.0,
) -> dict:
    """
    Calculate all amount fields for a timesheet row.

    Returns dict with keys:
      amount_hourly, amount_piece, amount_kpi, amount_bonus, amount_deduction, amount_total
    """
    amount_hourly = 0.0
    amount_piece = 0.0
    amount_kpi = 0.0
    amount_bonus = 0.0
    amount_deduction = 0.0

    if settlement_type == "hourly":
        amount_hourly = round(base_rate * hours, 2)
        amount_bonus = round(amount_hourly * shift_bonus_rate, 2)

    elif settlement_type == "piece":
        amount_piece = round(piece_rate * pieces, 2)
        amount_bonus = round(amount_piece * shift_bonus_rate, 2)

    elif settlement_type == "hourly_kpi":
        base_pay = base_rate * hours
        amount_hourly = round(base_pay, 2)
        amount_kpi = round(base_pay * kpi_ratio, 2)
        amount_bonus = round((amount_hourly + amount_kpi) * shift_bonus_rate, 2)

    elif settlement_type == "container":
        group_size = max(1, group_size)
        amount_hourly = round(group_pay / group_size, 2)
        amount_bonus = round(amount_hourly * shift_bonus_rate, 2)

    amount_total = round(amount_hourly + amount_piece + amount_kpi + amount_bonus - amount_deduction, 2)
    return {
        "amount_hourly": amount_hourly,
        "amount_piece": amount_piece,
        "amount_kpi": amount_kpi,
        "amount_bonus": amount_bonus,
        "amount_deduction": amount_deduction,
        "amount_total": amount_total,
    }
