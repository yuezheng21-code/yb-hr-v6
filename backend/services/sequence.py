"""
渊博579 HR V7 — Sequential Number Generator

Generates formatted sequential IDs like TS-202603-0001 / CN-202603-0001
within the current year+month window using a MAX query.
Caller must hold the DB transaction to prevent phantom reads.
"""
from __future__ import annotations
from datetime import datetime
from typing import Type
from sqlalchemy.orm import Session
from sqlalchemy import select, func


def next_sequence_no(db: Session, model_class: Type, column_attr, prefix: str, width: int = 4) -> str:
    """
    Return the next sequential ID string for the given model column.

    Example:
        next_sequence_no(db, Timesheet, Timesheet.ts_no, "TS-202603-") → "TS-202603-0001"

    Args:
        db: SQLAlchemy session
        model_class: The ORM model class (used to find pending, unflushed rows)
        column_attr: The SQLAlchemy column attribute to MAX over (e.g. Timesheet.ts_no)
        prefix: Full prefix including the separator (e.g. "TS-202603-")
        width: Zero-padding width for the sequence number (default 4)
    """
    def _seq(val) -> int:
        try:
            return int(str(val).rsplit("-", 1)[-1])
        except (ValueError, IndexError):
            return 0

    max_val = db.scalar(
        select(func.max(column_attr)).where(column_attr.like(f"{prefix}%"))
    )
    seq = _seq(max_val) if max_val else 0
    # Also consider objects added to the session but not yet flushed, so that
    # callers generating several numbers inside one transaction (batch create,
    # container split, settlement generation) never get duplicates.
    attr = column_attr.key
    for obj in db.new:
        if isinstance(obj, model_class):
            val = getattr(obj, attr, None)
            if val and str(val).startswith(prefix):
                seq = max(seq, _seq(val))
    return f"{prefix}{seq + 1:0{width}d}"


def make_prefix(code: str) -> str:
    """Build a YYYYMM-based prefix: e.g. 'TS' → 'TS-202603-'"""
    now = datetime.utcnow()
    return f"{code}-{now.year}{now.month:02d}-"
