"""
渊博579 HR V7 — Configuration
"""
import os
from typing import Any

# ── Database ─────────────────────────────────────────────────────────
DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
PORT: int = int(os.environ.get("PORT", 8000))

# ── JWT ──────────────────────────────────────────────────────────────
JWT_SECRET: str = os.environ.get("JWT_SECRET", "yb579-hr-v7-secret-change-in-prod")
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 480))  # 8 hours

# ── Business constants ────────────────────────────────────────────────
P1_HOURLY = 13.90  # € MiLoG floor + buffer

COEFFICIENTS: dict[str, float] = {
    "P1": 1.0, "P2": 1.05, "P3": 1.10, "P4": 1.20,
    "P5": 1.30, "P6": 1.40, "P7": 1.50, "P8": 1.60, "P9": 1.80,
}

SOCIAL_RATE = 0.21       # AG-Anteil Sozialversicherung
VACATION_RATE = 0.10     # Urlaubsrückstellung
SICK_RATE = 0.05         # Krankenstandsrückstellung
MGMT_OVERHEAD = 0.08     # 管理费分摊

REFERRAL_REWARDS: dict[str, dict[str, Any]] = {
    "P1_P4": {"onboard": 60,  "month1": 40,  "month3": 80,  "month6": 50,  "month12": 70,  "max": 300},
    "P5":    {"onboard": 250, "month1": 100, "month3": 150, "month6": 200, "month12": 100, "max": 800},
    "P6":    {"onboard": 300, "month1": 120, "month3": 180, "month6": 250, "month12": 150, "max": 1000},
    "P7":    {"onboard": 400, "month1": 150, "month3": 200, "month6": 300, "month12": 200, "max": 1250},
    "P8":    {"onboard": 500, "month1": 180, "month3": 250, "month6": 350, "month12": 220, "max": 1500},
    "P9":    {"onboard": 600, "month1": 200, "month3": 300, "month6": 400, "month12": 300, "max": 1800},
}
BATCH_BONUS: dict[int, int] = {3: 100, 5: 250, 10: 500}
RANK_THRESHOLDS: dict[int, float] = {0: 1.0, 4: 1.05, 10: 1.10, 20: 1.15}

COMMISSION_TIERS: dict[str, dict[str, Any]] = {
    "bronze":   {"min": 0,     "max": 5000,  "rate": 0.03, "months": 12, "delay": 3},
    "silver":   {"min": 5001,  "max": 15000, "rate": 0.04, "months": 12, "delay": 2},
    "gold":     {"min": 15001, "max": 40000, "rate": 0.05, "months": 18, "delay": 1},
    "platinum": {"min": 40001, "max": None,  "rate": 0.06, "months": 24, "delay": 0},
}
