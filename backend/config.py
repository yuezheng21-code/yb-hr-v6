"""
渊博+579 HR V6 — Configuration
"""
import os

DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
PORT: int = int(os.environ.get("PORT", 8000))
