"""
渊博579 HR V7 — Integrations Router
/api/v1/integrations

Manages third-party integration configs: WeChat Work, WhatsApp, WPS,
Tencent Docs, Feishu, Google Docs, Office 365.
"""
from __future__ import annotations
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.integration import IntegrationConfig
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.services import integration_service as svc

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])

# Platform catalogue: defines all supported integrations and their field schema
PLATFORM_CATALOGUE = [
    {
        "platform": "wechat_work",
        "label": "企业微信",
        "description": "企业微信群机器人 — 通过 Webhook 发送消息通知",
        "icon": "💬",
        "fields": [
            {"key": "webhook_url", "label": "Robot Webhook URL", "type": "url",
             "hint": "企业微信群 → 添加机器人 → 复制 Webhook URL", "secret": False},
        ],
        "extra_fields": [],
        "doc_url": "https://developer.work.weixin.qq.com/document/path/91770",
    },
    {
        "platform": "whatsapp",
        "label": "WhatsApp",
        "description": "WhatsApp Business Cloud API (Meta) — 发送 WhatsApp 消息",
        "icon": "📱",
        "fields": [
            {"key": "access_token", "label": "Permanent Access Token", "type": "password",
             "hint": "从 Meta Developers → WhatsApp → API Setup 获取", "secret": True},
        ],
        "extra_fields": [
            {"key": "phone_number_id", "label": "Phone Number ID", "type": "text",
             "hint": "Meta Developers 后台的 Phone Number ID", "secret": False},
            {"key": "test_recipient", "label": "测试接收号码", "type": "text",
             "hint": "E.164 格式，如 +4917612345678", "secret": False},
        ],
        "doc_url": "https://developers.facebook.com/docs/whatsapp/cloud-api",
    },
    {
        "platform": "wps",
        "label": "WPS",
        "description": "WPS 开放平台 — 文档通知与协作",
        "icon": "📄",
        "fields": [
            {"key": "app_id", "label": "App ID", "type": "text",
             "hint": "WPS 开放平台应用的 App ID", "secret": False},
            {"key": "app_secret", "label": "App Secret", "type": "password",
             "hint": "WPS 开放平台应用的 App Secret", "secret": True},
            {"key": "access_token", "label": "Access Token (可选)", "type": "password",
             "hint": "预先获取的访问令牌，可留空由系统自动获取", "secret": True},
        ],
        "extra_fields": [],
        "doc_url": "https://open.wps.cn/docs",
    },
    {
        "platform": "tencent_docs",
        "label": "腾讯文档",
        "description": "腾讯文档 Open API — 文档共享与通知",
        "icon": "📝",
        "fields": [
            {"key": "app_id", "label": "App ID", "type": "text",
             "hint": "腾讯文档开放平台 App ID", "secret": False},
            {"key": "app_secret", "label": "App Secret", "type": "password",
             "hint": "腾讯文档开放平台 App Secret", "secret": True},
            {"key": "access_token", "label": "Access Token (可选)", "type": "password",
             "hint": "OAuth2 access token，可留空由系统自动获取", "secret": True},
        ],
        "extra_fields": [],
        "doc_url": "https://docs.qq.com/openapi",
    },
    {
        "platform": "feishu",
        "label": "飞书",
        "description": "飞书机器人 — 通过 Webhook 发送消息通知",
        "icon": "🪁",
        "fields": [
            {"key": "webhook_url", "label": "飞书机器人 Webhook URL", "type": "url",
             "hint": "飞书群 → 群设置 → 机器人 → 添加自定义机器人 → 复制 Webhook", "secret": False},
        ],
        "extra_fields": [
            {"key": "sign_key", "label": "签名校验密钥 (可选)", "type": "password",
             "hint": "若机器人开启了签名校验，填写此密钥", "secret": True},
        ],
        "doc_url": "https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN",
    },
    {
        "platform": "google_docs",
        "label": "Google Docs",
        "description": "Google Docs API — 创建与导出文档到 Google Drive",
        "icon": "📋",
        "fields": [],
        "extra_fields": [
            {"key": "service_account_json", "label": "Service Account JSON", "type": "textarea",
             "hint": "从 Google Cloud Console → IAM & Admin → Service Accounts 下载 JSON 密钥文件内容", "secret": True},
            {"key": "folder_id", "label": "目标文件夹 ID (可选)", "type": "text",
             "hint": "Google Drive 文件夹 ID，用于存放导出文档", "secret": False},
        ],
        "doc_url": "https://developers.google.com/docs/api",
    },
    {
        "platform": "office365",
        "label": "Office 365",
        "description": "Microsoft Graph API — Teams 通知与 SharePoint 文档",
        "icon": "🏢",
        "fields": [
            {"key": "app_id", "label": "Client (App) ID", "type": "text",
             "hint": "Azure Active Directory → App registrations → Client ID", "secret": False},
            {"key": "app_secret", "label": "Client Secret", "type": "password",
             "hint": "Azure → App registrations → Certificates & secrets", "secret": True},
        ],
        "extra_fields": [
            {"key": "tenant_id", "label": "Tenant ID", "type": "text",
             "hint": "Azure Active Directory → Overview → Tenant ID", "secret": False},
            {"key": "team_id", "label": "Teams Team ID (可选)", "type": "text",
             "hint": "用于发送 Teams 消息的 Team ID", "secret": False},
            {"key": "channel_id", "label": "Teams Channel ID (可选)", "type": "text",
             "hint": "用于发送 Teams 消息的 Channel ID", "secret": False},
            {"key": "drive_id", "label": "SharePoint Drive ID (可选)", "type": "text",
             "hint": "用于上传文档的 SharePoint drive ID", "secret": False},
        ],
        "doc_url": "https://learn.microsoft.com/en-us/graph/overview",
    },
]

_PLATFORM_KEYS = {p["platform"] for p in PLATFORM_CATALOGUE}


def _admin_only(user: User):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")


def _cfg_dict(cfg: IntegrationConfig, hide_secrets: bool = True) -> dict:
    extra = {}
    try:
        extra = json.loads(cfg.extra_config or "{}")
    except Exception:
        pass

    # Mask secrets in extra
    if hide_secrets:
        for key in ("service_account_json", "sign_key"):
            if key in extra and extra[key]:
                extra[key] = "***"

    return {
        "id": cfg.id,
        "platform": cfg.platform,
        "label": cfg.label,
        "enabled": cfg.enabled,
        "webhook_url": cfg.webhook_url,
        "access_token": "***" if (hide_secrets and cfg.access_token) else cfg.access_token,
        "app_id": cfg.app_id,
        "app_secret": "***" if (hide_secrets and cfg.app_secret) else cfg.app_secret,
        "extra_config": extra,
        "last_tested_at": cfg.last_tested_at.isoformat() if cfg.last_tested_at else None,
        "last_test_status": cfg.last_test_status,
        "created_at": cfg.created_at.isoformat() if cfg.created_at else None,
        "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None,
    }


@router.get("/catalogue")
def get_catalogue():
    """Return the full platform catalogue (public — used by frontend to render forms)."""
    return PLATFORM_CATALOGUE


@router.get("")
def list_integrations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _admin_only(user)
    existing = {c.platform: c for c in db.scalars(select(IntegrationConfig)).all()}

    # Return all platforms (configured or not)
    result = []
    for p in PLATFORM_CATALOGUE:
        cfg = existing.get(p["platform"])
        if cfg:
            d = _cfg_dict(cfg)
        else:
            d = {
                "platform": p["platform"],
                "label": p["label"],
                "enabled": False,
                "webhook_url": None,
                "access_token": None,
                "app_id": None,
                "app_secret": None,
                "extra_config": {},
                "last_tested_at": None,
                "last_test_status": None,
                "created_at": None,
                "updated_at": None,
            }
        result.append(d)
    return result


@router.put("/{platform}")
def upsert_integration(
    platform: str,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update integration config for a platform."""
    _admin_only(user)
    if platform not in _PLATFORM_KEYS:
        raise HTTPException(400, f"Unknown platform: {platform}")

    # Find catalogue entry for the label
    cat_entry = next((p for p in PLATFORM_CATALOGUE if p["platform"] == platform), {})

    cfg = db.scalar(select(IntegrationConfig).where(IntegrationConfig.platform == platform))
    if not cfg:
        cfg = IntegrationConfig(platform=platform, label=cat_entry.get("label", platform))
        db.add(cfg)

    cfg.label = cat_entry.get("label", platform)
    cfg.enabled = body.get("enabled", cfg.enabled)

    # Only update fields if provided and not masked
    if "webhook_url" in body:
        cfg.webhook_url = body["webhook_url"] or None
    if "access_token" in body and body["access_token"] != "***":
        cfg.access_token = body["access_token"] or None
    if "app_id" in body:
        cfg.app_id = body["app_id"] or None
    if "app_secret" in body and body["app_secret"] != "***":
        cfg.app_secret = body["app_secret"] or None

    # Merge extra_config
    if "extra_config" in body and isinstance(body["extra_config"], dict):
        existing_extra = {}
        try:
            existing_extra = json.loads(cfg.extra_config or "{}")
        except Exception:
            pass
        # Only update non-masked values
        for k, v in body["extra_config"].items():
            if v != "***":
                existing_extra[k] = v
        cfg.extra_config = json.dumps(existing_extra, ensure_ascii=False)

    cfg.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cfg)
    return _cfg_dict(cfg)


@router.post("/{platform}/test")
async def test_integration(
    platform: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Test the connection for a platform. Updates last_tested_at and last_test_status."""
    _admin_only(user)
    cfg = db.scalar(select(IntegrationConfig).where(IntegrationConfig.platform == platform))
    if not cfg:
        raise HTTPException(404, "Integration not configured")
    if not cfg.enabled:
        raise HTTPException(400, "Integration is disabled")

    cfg_dict = _cfg_dict(cfg, hide_secrets=False)
    # Restore actual extra_config for service calls
    try:
        cfg_dict["extra_config"] = json.loads(cfg.extra_config or "{}")
    except Exception:
        cfg_dict["extra_config"] = {}

    try:
        result = await svc.platform_test(cfg_dict)
        cfg.last_test_status = "ok"
    except Exception as e:
        cfg.last_test_status = "fail"
        cfg.last_tested_at = datetime.utcnow()
        db.commit()
        raise HTTPException(422, f"集成测试失败: {e}")

    cfg.last_tested_at = datetime.utcnow()
    db.commit()
    return result


@router.post("/{platform}/send")
async def send_message(
    platform: str,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a text message/notification via the configured platform."""
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "admin or hr only")

    cfg = db.scalar(select(IntegrationConfig).where(IntegrationConfig.platform == platform))
    if not cfg:
        raise HTTPException(404, "Integration not configured")
    if not cfg.enabled:
        raise HTTPException(400, "Integration is disabled")

    text = body.get("text", "")
    if not text:
        raise HTTPException(400, "text is required")

    cfg_dict = _cfg_dict(cfg, hide_secrets=False)
    try:
        cfg_dict["extra_config"] = json.loads(cfg.extra_config or "{}")
    except Exception:
        cfg_dict["extra_config"] = {}

    try:
        return await svc.platform_send(cfg_dict, text)
    except Exception as e:
        raise HTTPException(422, f"发送失败: {e}")
