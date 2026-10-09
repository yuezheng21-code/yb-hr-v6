"""
渊博579 HR V7 — 系统设置存储

设置保存在 system_settings 表（key → JSON 值），进程内缓存，保存时刷新。
未保存过的键使用 DEFAULTS。保存后立即作用于：
  · 成本测算 / 结算的 P1 时薪与各项费率
  · ArbZG / Zeitkonto 阈值（compliance.ARBZG / ZEITKONTO）
  · 登录会话时长（新签发的 token）
"""
from __future__ import annotations
import json
import threading
from datetime import datetime
from typing import Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
import backend.config as cfg

DEFAULTS: dict[str, Any] = {
    "p1_hourly_rate": cfg.P1_HOURLY,
    "social_rate": cfg.SOCIAL_RATE,
    "vacation_rate": cfg.VACATION_RATE,
    "sick_rate": cfg.SICK_RATE,
    "mgmt_overhead": cfg.MGMT_OVERHEAD,
    "default_margin": 0.20,
    "arbzg_daily_limit": 10.0,
    "arbzg_weekly_limit": 48.0,
    "zeitkonto_max_positive": 120.0,
    "zeitkonto_max_negative": -40.0,
    "session_timeout_minutes": cfg.ACCESS_TOKEN_EXPIRE_MINUTES,
    "company_name": "渊博579 GmbH",
    "company_address": "",
    "company_representative": "",
    "company_timezone": "Europe/Berlin",
    # 官网（公开页面）联系方式
    "company_email": "",
    "company_phone": "",
    # 财务 / 开票（§ 14 UStG 发票必备信息）
    "company_tax_number": "",       # Steuernummer
    "company_vat_id": "",           # USt-IdNr.
    "company_register": "",         # Handelsregister, z. B. "Amtsgericht Dortmund HRB 12345"
    "company_bank": "",
    "company_iban": "",
    "company_bic": "",
    "vat_rate": 0.19,
    "invoice_payment_days": 14,
    # DATEV Buchungsstapel（EXTF）— 科目按税务师的 Kontenrahmen 配置
    "datev_berater_nr": "",
    "datev_mandant_nr": "",
    "datev_skr": "03",
    "datev_fiscal_year_start": 1,    # 财年开始月份
    "datev_revenue_account": "8400",       # 19% 营业收入（SKR03 8400 / SKR04 4400）
    "datev_revenue_rc_account": "8337",    # § 13b 反向征收收入（SKR03 8337 / SKR04 4337）
    "datev_expense_account": "4780",       # 外包人工/劳务费用（SKR03 4780 / SKR04 6780）
    "datev_expense_bu": "9",               # 进项税 19% BU-Schlüssel
    "datev_debitor_start": 10000,
    "datev_kreditor_start": 70000,
    # DATEV LODAS 工资录入（Lohnarten 须与税务师的 Mandant 设置一致）
    "lodas_la_hours": "",
    "lodas_la_piece": "",
    "lodas_la_bonus": "",
    "lodas_la_deduction": "",
}

# (min, max) for numeric keys; strings must be non-empty
_RANGES: dict[str, tuple[float, float]] = {
    "p1_hourly_rate": (0.01, 1000),
    "social_rate": (0, 1), "vacation_rate": (0, 1), "sick_rate": (0, 1),
    "mgmt_overhead": (0, 1), "default_margin": (0, 0.95),
    "arbzg_daily_limit": (1, 24), "arbzg_weekly_limit": (1, 168),
    "zeitkonto_max_positive": (0, 1000), "zeitkonto_max_negative": (-1000, 0),
    "session_timeout_minutes": (5, 7 * 24 * 60),
    "vat_rate": (0, 0.5), "invoice_payment_days": (0, 365), "datev_fiscal_year_start": (1, 12),
    "datev_debitor_start": (1, 99999999), "datev_kreditor_start": (1, 99999999),
}

PRICE_MATRIX_KEY = "price_matrix"  # quotation price matrix override (JSON), see quotation_builder

_REQUIRED_TEXT = {"company_name", "company_timezone"}

_lock = threading.Lock()
_cache: dict[str, Any] = dict(DEFAULTS)
_meta: dict[str, Any] = {"updated_at": None, "updated_by": None}
_loaded = False


def _apply_side_effects() -> None:
    from backend.services.compliance import ARBZG, ZEITKONTO
    ARBZG["daily_hard_limit"] = float(_cache["arbzg_daily_limit"])
    ARBZG["weekly_limit"] = float(_cache["arbzg_weekly_limit"])
    ZEITKONTO["max_positive_balance"] = float(_cache["zeitkonto_max_positive"])
    ZEITKONTO["max_negative_balance"] = float(_cache["zeitkonto_max_negative"])
    cfg.ACCESS_TOKEN_EXPIRE_MINUTES = int(_cache["session_timeout_minutes"])


def load(db: Session) -> dict[str, Any]:
    """(Re)load all settings from the database into the cache."""
    global _loaded
    from backend.models.system_setting import SystemSetting
    values = dict(DEFAULTS)
    latest = None
    for row in db.scalars(select(SystemSetting)).all():
        if row.key == PRICE_MATRIX_KEY:
            _restore_price_matrix(row.value)
            continue
        if row.key not in DEFAULTS:
            continue
        try:
            values[row.key] = json.loads(row.value)
        except (ValueError, TypeError):
            continue
        if latest is None or (row.updated_at and row.updated_at > latest.updated_at):
            latest = row
    with _lock:
        _cache.clear()
        _cache.update(values)
        _meta["updated_at"] = latest.updated_at.isoformat() if latest and latest.updated_at else None
        _meta["updated_by"] = latest.updated_by if latest else None
        _loaded = True
        _apply_side_effects()
    return dict(values)


def _restore_price_matrix(raw: str) -> None:
    from backend.services import quotation_builder
    try:
        quotation_builder.update_price_matrix(json.loads(raw))
    except (ValueError, TypeError):
        pass


def save_price_matrix(db: Session, matrix: dict, username: str) -> None:
    """Persist the quotation price matrix override. Caller commits."""
    from backend.models.system_setting import SystemSetting
    row = db.get(SystemSetting, PRICE_MATRIX_KEY)
    value = json.dumps(matrix, ensure_ascii=False)
    if row is None:
        db.add(SystemSetting(key=PRICE_MATRIX_KEY, value=value, updated_by=username, updated_at=datetime.utcnow()))
    else:
        row.value, row.updated_by, row.updated_at = value, username, datetime.utcnow()


def _ensure_loaded() -> None:
    if _loaded:
        return
    try:
        from backend.database import SessionLocal
        with SessionLocal() as db:
            load(db)
    except Exception:
        pass  # DB not ready yet — defaults stay in effect


def get(key: str) -> Any:
    _ensure_loaded()
    with _lock:
        return _cache.get(key, DEFAULTS.get(key))


def get_all() -> dict[str, Any]:
    _ensure_loaded()
    with _lock:
        return dict(_cache)


def meta() -> dict[str, Any]:
    with _lock:
        return dict(_meta)


def validate(updates: dict[str, Any]) -> dict[str, Any]:
    """Return cleaned updates; raise ValueError with a readable message."""
    clean: dict[str, Any] = {}
    for k, v in updates.items():
        if k not in DEFAULTS:
            continue
        default = DEFAULTS[k]
        if isinstance(default, str):
            if not isinstance(v, str) or (not v.strip() and k in _REQUIRED_TEXT):
                raise ValueError(f"{k} 不能为空")
            clean[k] = v.strip()
            continue
        try:
            num = float(v)
        except (TypeError, ValueError):
            raise ValueError(f"{k} 必须是数字")
        lo, hi = _RANGES.get(k, (float("-inf"), float("inf")))
        if not lo <= num <= hi:
            raise ValueError(f"{k} 超出范围 [{lo}, {hi}]")
        clean[k] = int(num) if isinstance(default, int) and not isinstance(default, bool) else num
    return clean


def save(db: Session, updates: dict[str, Any], username: str) -> dict[str, Any]:
    """Validate, persist and refresh cache. Returns {key: (old, new)} for changed keys. Caller commits."""
    from backend.models.system_setting import SystemSetting
    clean = validate(updates)
    current = get_all()
    changed = {k: (current.get(k), v) for k, v in clean.items() if current.get(k) != v}
    now = datetime.utcnow()
    for k, (_, v) in changed.items():
        row = db.get(SystemSetting, k)
        if row is None:
            db.add(SystemSetting(key=k, value=json.dumps(v, ensure_ascii=False), updated_by=username, updated_at=now))
        else:
            row.value = json.dumps(v, ensure_ascii=False)
            row.updated_by = username
            row.updated_at = now
    return changed
