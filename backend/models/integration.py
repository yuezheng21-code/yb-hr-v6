"""
渊博579 HR V7 — Integration Configuration Model
Stores per-platform credentials and settings for all third-party integrations.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    platform: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    # Supported: wechat_work | whatsapp | wps | tencent_docs | feishu | google_docs | office365

    label: Mapped[str] = mapped_column(String(100), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Generic webhook URL (企业微信/飞书 robot webhooks, WhatsApp endpoint override)
    webhook_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Access / API token (WhatsApp token, Feishu app token, etc.)
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # App/Client credentials
    app_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    app_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Platform-specific extra config as JSON string
    extra_config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # e.g. WhatsApp: {"phone_number_id": "...", "recipient": "+49..."}
    # e.g. Google: {"service_account_json": "...", "folder_id": "..."}
    # e.g. Office365: {"tenant_id": "...", "client_id": "...", "drive_id": "..."}

    last_tested_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    last_test_status: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # "ok" | "fail" | None

    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow(),
    )
