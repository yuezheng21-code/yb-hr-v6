"""
渊博579 HR V7 — System Message Model
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class SystemMessage(Base):
    __tablename__ = "system_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sender: Mapped[str] = mapped_column(String(50), nullable=False)     # username
    sender_display: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # None = broadcast to all; role name = to all in role; username = direct
    recipient_role: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # if set, this is sent to all users of this role
    subject: Mapped[Optional[str]] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    msg_type: Mapped[str] = mapped_column(String(20), default="notice")
    # notice / alert / task / system
    priority: Mapped[str] = mapped_column(String(10), default="normal")
    # normal / high / urgent
    is_broadcast: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class MessageRead(Base):
    """Tracks which user has read which message."""
    __tablename__ = "message_reads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("system_messages.id", ondelete="CASCADE"), index=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    read_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
