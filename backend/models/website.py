"""
渊博579 HR V7 — 官网线索（公开页面「企业询价」表单）

Lead：潜在客户需求 → 跟进 → 生成报价单（quotations）→ 成交/流失。
求职者投递直接进入人才池（talent_pool, source=website），不在此表。
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_no: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    location: Mapped[Optional[str]] = mapped_column(String(150))       # 仓库地址 / 城市
    services: Mapped[Optional[str]] = mapped_column(String(200))       # 逗号分隔：amazon,temu,container…
    headcount: Mapped[Optional[int]] = mapped_column(Integer)
    volume: Mapped[Optional[str]] = mapped_column(String(200))         # 业务量描述（柜/周、件/天…）
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(50))        # 短期/长期/旺季…
    shifts: Mapped[Optional[str]] = mapped_column(String(100))
    message: Mapped[Optional[str]] = mapped_column(Text)
    language: Mapped[Optional[str]] = mapped_column(String(5))
    # new / contacted / quoting / quoted / won / lost / spam
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)                 # 内部跟进记录
    quotation_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("quotations.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="website")
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), index=True)
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())
