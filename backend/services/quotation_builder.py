"""
渊博579 HR V7 — Quotation Builder

阶梯价格表 v7.0:
- 4类作业: 出库(9A) / 入库(9B) / WLE(9C) / 卸柜(9D)
- 4档折扣: 标准 0% / Bronze -3% / Silver -5% / Gold -8%
- 独立评定, 互不叠加
- 退货/增值/附加费不参与折扣
"""
from __future__ import annotations
from typing import Optional


# v7.0 价格矩阵 (€/unit or €/h)
# Tier: standard / bronze / silver / gold
# Each biz line has a base unit price; discount applied to non-excluded items
_runtime_matrix: dict = {}

DEFAULT_PRICE_MATRIX: dict = {
    "9A": {  # 出库 (outbound)
        "label": "出库作业",
        "unit": "件",
        "base_price": 0.18,   # €/件
        "tiers": {
            "standard": {"min_volume": 0,      "max_volume": 50000,  "discount": 0.00},
            "bronze":   {"min_volume": 50001,  "max_volume": 100000, "discount": 0.03},
            "silver":   {"min_volume": 100001, "max_volume": 200000, "discount": 0.05},
            "gold":     {"min_volume": 200001, "max_volume": None,   "discount": 0.08},
        },
    },
    "9B": {  # 入库 (inbound)
        "label": "入库作业",
        "unit": "件",
        "base_price": 0.16,
        "tiers": {
            "standard": {"min_volume": 0,      "max_volume": 40000,  "discount": 0.00},
            "bronze":   {"min_volume": 40001,  "max_volume": 80000,  "discount": 0.03},
            "silver":   {"min_volume": 80001,  "max_volume": 150000, "discount": 0.05},
            "gold":     {"min_volume": 150001, "max_volume": None,   "discount": 0.08},
        },
    },
    "9C": {  # WLE (Warenlagererkundung/Retoure)
        "label": "WLE作业",
        "unit": "件",
        "base_price": 0.22,
        "tiers": {
            "standard": {"min_volume": 0,     "max_volume": 30000,  "discount": 0.00},
            "bronze":   {"min_volume": 30001, "max_volume": 60000,  "discount": 0.03},
            "silver":   {"min_volume": 60001, "max_volume": 120000, "discount": 0.05},
            "gold":     {"min_volume": 120001,"max_volume": None,   "discount": 0.08},
        },
    },
    "9D": {  # 卸柜 (container unloading)
        "label": "卸柜作业",
        "unit": "h",
        "base_price": 28.50,  # €/h
        "tiers": {
            "standard": {"min_volume": 0,   "max_volume": 200,  "discount": 0.00},
            "bronze":   {"min_volume": 201, "max_volume": 500,  "discount": 0.03},
            "silver":   {"min_volume": 501, "max_volume": 1000, "discount": 0.05},
            "gold":     {"min_volume": 1001,"max_volume": None, "discount": 0.08},
        },
    },
}

# Non-discountable service codes
NON_DISCOUNT_CODES = {"returns", "value_added", "surcharge"}


def get_price_matrix() -> dict:
    """Return the current price matrix (runtime override or default)."""
    return _runtime_matrix if _runtime_matrix else DEFAULT_PRICE_MATRIX


def update_price_matrix(data: dict) -> dict:
    """Update the runtime price matrix. Validates basic structure."""
    global _runtime_matrix
    if not isinstance(data, dict) or not data:
        raise ValueError("Price matrix must be a non-empty dict")
    _runtime_matrix = data
    return _runtime_matrix


def determine_tier(biz_line: str, monthly_volume: float, matrix: dict | None = None) -> str:
    """
    Determine the volume tier for a biz line given its monthly volume.
    Returns: "standard" / "bronze" / "silver" / "gold"
    """
    m = matrix or DEFAULT_PRICE_MATRIX
    biz = m.get(biz_line.upper())
    if not biz:
        return "standard"
    for tier_name in ("gold", "silver", "bronze", "standard"):
        t = biz["tiers"][tier_name]
        if t["max_volume"] is None:
            if monthly_volume >= t["min_volume"]:
                return tier_name
        elif t["min_volume"] <= monthly_volume <= t["max_volume"]:
            return tier_name
    return "standard"


def calc_line_item(
    biz_line: str,
    volume: float,
    override_price: float | None = None,
    matrix: dict | None = None,
    exclude_discount: bool = False,
) -> dict:
    """
    Calculate cost for one line item.
    Returns dict with tier, unit_price, discount, amount.
    """
    m = matrix or DEFAULT_PRICE_MATRIX
    biz = m.get(biz_line.upper())
    if not biz:
        unit_price = override_price or 0.0
        return {"biz_line": biz_line, "volume": volume, "unit_price": unit_price,
                "tier": "standard", "discount": 0.0, "net_price": unit_price,
                "amount": round(unit_price * volume, 2)}

    tier = determine_tier(biz_line, volume, m)
    base_price = override_price or biz["base_price"]
    discount = 0.0 if exclude_discount else biz["tiers"][tier]["discount"]
    net_price = round(base_price * (1 - discount), 4)
    amount = round(net_price * volume, 2)

    return {
        "biz_line": biz_line,
        "label": biz["label"],
        "unit": biz["unit"],
        "volume": volume,
        "base_price": base_price,
        "tier": tier,
        "discount": discount,
        "net_price": net_price,
        "amount": amount,
    }


def build_quote_items(line_items: list[dict], matrix: dict | None = None) -> dict:
    """
    Build full quotation from line items.
    Each item: {"biz_line": "9A", "volume": 80000, "exclude_discount": False}
    Returns: {"items": [...], "subtotal": ..., "mwst": ..., "total": ...}
    """
    results = []
    subtotal = 0.0
    for item in line_items:
        biz = item.get("biz_line", "")
        vol = float(item.get("volume", 0))
        override = item.get("unit_price")
        exclude = item.get("exclude_discount", False) or biz.lower() in NON_DISCOUNT_CODES
        calc = calc_line_item(biz, vol, override_price=override, matrix=matrix, exclude_discount=exclude)
        results.append(calc)
        subtotal += calc["amount"]

    subtotal = round(subtotal, 2)
    mwst = round(subtotal * 0.19, 2)  # 19% MwSt
    total = round(subtotal + mwst, 2)

    return {
        "items": results,
        "subtotal_netto": subtotal,
        "mwst_19pct": mwst,
        "total_brutto": total,
    }
