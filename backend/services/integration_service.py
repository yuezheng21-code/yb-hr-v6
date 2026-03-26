"""
渊博579 HR V7 — Integration Service
Per-platform send/test adapters.

Platforms:
  wechat_work   — 企业微信群机器人 (robot webhook)
  whatsapp      — WhatsApp Business Cloud API (Meta Graph API)
  wps           — WPS Open Platform (document notify/export)
  tencent_docs  — 腾讯文档 (Tencent Docs API)
  feishu        — 飞书机器人 + 飞书文档 (Feishu/Lark)
  google_docs   — Google Docs API (service account)
  office365     — Microsoft Graph API (SharePoint/OneDrive)
"""
from __future__ import annotations
import json
import logging
from datetime import datetime
from typing import Optional

import httpx

log = logging.getLogger(__name__)


# ─── WeChat Work (企业微信群机器人) ─────────────────────────────────────────────

async def wechat_work_send(webhook_url: str, text: str) -> dict:
    """Send a text message via 企业微信 robot webhook."""
    payload = {
        "msgtype": "text",
        "text": {"content": text},
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(webhook_url, json=payload)
    data = r.json()
    if data.get("errcode", -1) != 0:
        raise RuntimeError(f"企业微信错误: {data.get('errmsg', r.text)}")
    return {"platform": "wechat_work", "status": "ok", "response": data}


async def wechat_work_test(webhook_url: str) -> dict:
    return await wechat_work_send(webhook_url, "🤖 渊博579 HR 系统连接测试 — 连接成功！")


# ─── WhatsApp Business Cloud API ───────────────────────────────────────────────

_WHATSAPP_API = "https://graph.facebook.com/v19.0"


async def whatsapp_send(
    access_token: str,
    phone_number_id: str,
    recipient_phone: str,
    text: str,
) -> dict:
    """Send a text message via WhatsApp Business Cloud API."""
    url = f"{_WHATSAPP_API}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_phone,
        "type": "text",
        "text": {"body": text},
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, json=payload, headers=headers)
    if not r.is_success:
        raise RuntimeError(f"WhatsApp error {r.status_code}: {r.text[:200]}")
    return {"platform": "whatsapp", "status": "ok", "response": r.json()}


async def whatsapp_test(access_token: str, phone_number_id: str, recipient_phone: str) -> dict:
    return await whatsapp_send(
        access_token, phone_number_id, recipient_phone,
        "🤖 渊博579 HR 系统连接测试 — WhatsApp 集成成功！"
    )


# ─── Feishu / Lark (飞书机器人 webhook) ──────────────────────────────────────────

async def feishu_send(webhook_url: str, text: str) -> dict:
    """Send a text message via Feishu robot webhook."""
    payload = {
        "msg_type": "text",
        "content": {"text": text},
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(webhook_url, json=payload)
    data = r.json()
    if data.get("StatusCode", -1) != 0 and data.get("code", -1) != 0:
        raise RuntimeError(f"飞书错误: {data}")
    return {"platform": "feishu", "status": "ok", "response": data}


async def feishu_test(webhook_url: str) -> dict:
    return await feishu_send(webhook_url, "🤖 渊博579 HR 系统连接测试 — 飞书集成成功！")


# ─── WPS Open Platform ─────────────────────────────────────────────────────────

_WPS_API = "https://qingliu.wps.cn/openapi/v1"


async def wps_send_notify(
    access_token: str,
    app_id: str,
    title: str,
    content: str,
    extra: Optional[dict] = None,
) -> dict:
    """
    Send a notification to WPS Qingliu (轻流) or WPS Open Platform.
    Requires WPS Open Platform app credentials.
    https://open.wps.cn/docs
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-AppId": app_id,
    }
    payload = {"title": title, "content": content, **(extra or {})}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(f"{_WPS_API}/notify", json=payload, headers=headers)
    if not r.is_success:
        raise RuntimeError(f"WPS API error {r.status_code}: {r.text[:200]}")
    return {"platform": "wps", "status": "ok", "response": r.json()}


async def wps_test(access_token: str, app_id: str) -> dict:
    """Test WPS connection by calling user-info endpoint."""
    headers = {"Authorization": f"Bearer {access_token}", "X-AppId": app_id}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{_WPS_API}/user/info", headers=headers)
    if not r.is_success:
        raise RuntimeError(f"WPS API error {r.status_code}: {r.text[:200]}")
    return {"platform": "wps", "status": "ok", "user": r.json()}


# ─── Tencent Docs (腾讯文档 Open API) ──────────────────────────────────────────

_TENCENT_DOCS_API = "https://docs.qq.com/openapi"


async def tencent_docs_send(access_token: str, text: str) -> dict:
    """
    Notify via Tencent Docs channel (requires OAuth2 access_token from
    docs.qq.com/openapi/v2/auth/token).
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"message": text}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(f"{_TENCENT_DOCS_API}/v2/notify", json=payload, headers=headers)
    if not r.is_success:
        raise RuntimeError(f"腾讯文档 API error {r.status_code}: {r.text[:200]}")
    return {"platform": "tencent_docs", "status": "ok", "response": r.json()}


async def tencent_docs_test(access_token: str) -> dict:
    """Test Tencent Docs via user info endpoint."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{_TENCENT_DOCS_API}/v2/user/info", headers=headers)
    if not r.is_success:
        raise RuntimeError(f"腾讯文档 API error {r.status_code}: {r.text[:200]}")
    return {"platform": "tencent_docs", "status": "ok", "user": r.json()}


# ─── Google Docs / Drive ────────────────────────────────────────────────────────

_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_DOCS_API = "https://docs.googleapis.com/v1"
_GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3"


async def _google_get_token(service_account_json: dict) -> str:
    """Exchange a service-account JSON for a Bearer token (JWT assertion)."""
    import base64
    import time
    try:
        import jwt as pyjwt
    except ImportError:
        raise RuntimeError("PyJWT is required for Google service-account auth")

    sa = service_account_json
    now = int(time.time())
    claim = {
        "iss": sa["client_email"],
        "scope": "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive",
        "aud": _GOOGLE_TOKEN_URL,
        "iat": now,
        "exp": now + 3600,
    }
    assertion = pyjwt.encode(claim, sa["private_key"], algorithm="RS256")
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(_GOOGLE_TOKEN_URL, data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        })
    if not r.is_success:
        raise RuntimeError(f"Google OAuth error: {r.text[:200]}")
    return r.json()["access_token"]


async def google_docs_create(service_account_json_str: str, title: str, content: str) -> dict:
    """Create a Google Doc and write content (batch update)."""
    sa = json.loads(service_account_json_str)
    token = await _google_get_token(sa)
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(timeout=20) as client:
        # Create document
        r = await client.post(
            f"{_GOOGLE_DOCS_API}/documents",
            json={"title": title},
            headers=headers,
        )
        if not r.is_success:
            raise RuntimeError(f"Google Docs create error: {r.text[:200]}")
        doc = r.json()
        doc_id = doc["documentId"]

        # Insert content
        r2 = await client.post(
            f"{_GOOGLE_DOCS_API}/documents/{doc_id}:batchUpdate",
            json={"requests": [{"insertText": {"location": {"index": 1}, "text": content}}]},
            headers=headers,
        )
    return {
        "platform": "google_docs",
        "status": "ok",
        "document_id": doc_id,
        "url": f"https://docs.google.com/document/d/{doc_id}/edit",
    }


async def google_docs_test(service_account_json_str: str) -> dict:
    sa = json.loads(service_account_json_str)
    token = await _google_get_token(sa)
    # Just verify the token was obtained
    return {"platform": "google_docs", "status": "ok", "token_preview": token[:20] + "..."}


# ─── Office 365 / Microsoft Graph API ─────────────────────────────────────────

_MS_TOKEN_URL_TMPL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
_GRAPH_API = "https://graph.microsoft.com/v1.0"


async def _ms_get_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    """Obtain a Microsoft Graph access token via client credentials flow."""
    url = _MS_TOKEN_URL_TMPL.format(tenant_id=tenant_id)
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://graph.microsoft.com/.default",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, data=data)
    if not r.is_success:
        raise RuntimeError(f"Microsoft OAuth error: {r.text[:200]}")
    return r.json()["access_token"]


async def office365_send_teams(
    tenant_id: str, client_id: str, client_secret: str,
    channel_id: str, team_id: str, text: str,
) -> dict:
    """Send a message to a Teams channel via Microsoft Graph."""
    token = await _ms_get_token(tenant_id, client_id, client_secret)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"body": {"content": text}}
    url = f"{_GRAPH_API}/teams/{team_id}/channels/{channel_id}/messages"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(url, json=payload, headers=headers)
    if not r.is_success:
        raise RuntimeError(f"Teams API error {r.status_code}: {r.text[:200]}")
    return {"platform": "office365", "status": "ok", "message_id": r.json().get("id")}


async def office365_test(tenant_id: str, client_id: str, client_secret: str) -> dict:
    """Test Office 365 by obtaining a token."""
    token = await _ms_get_token(tenant_id, client_id, client_secret)
    return {"platform": "office365", "status": "ok", "token_preview": token[:20] + "..."}


def _parse_extra(raw) -> dict:
    """
    Return extra_config as a plain dict regardless of whether it arrived as
    a JSON string (direct from DB) or an already-decoded dict (from router).
    """
    if isinstance(raw, dict):
        return raw
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return {}


# ─── Generic dispatcher ─────────────────────────────────────────────────────────

async def platform_test(cfg: dict) -> dict:
    """
    Run the appropriate test for a given platform config dict.
    `cfg` is the full IntegrationConfig as a dict.
    """
    platform = cfg["platform"]
    extra = _parse_extra(cfg.get("extra_config"))

    try:
        if platform == "wechat_work":
            if not cfg.get("webhook_url"):
                raise ValueError("需要配置 Webhook URL")
            return await wechat_work_test(cfg["webhook_url"])

        elif platform == "whatsapp":
            if not cfg.get("access_token"):
                raise ValueError("需要配置 Access Token")
            pnid = extra.get("phone_number_id", "")
            recipient = extra.get("test_recipient", "")
            if not pnid or not recipient:
                raise ValueError("需要在额外配置中填写 phone_number_id 和 test_recipient")
            return await whatsapp_test(cfg["access_token"], pnid, recipient)

        elif platform == "feishu":
            if not cfg.get("webhook_url"):
                raise ValueError("需要配置飞书机器人 Webhook URL")
            return await feishu_test(cfg["webhook_url"])

        elif platform == "wps":
            if not cfg.get("access_token") or not cfg.get("app_id"):
                raise ValueError("需要配置 Access Token 和 App ID")
            return await wps_test(cfg["access_token"], cfg["app_id"])

        elif platform == "tencent_docs":
            if not cfg.get("access_token"):
                raise ValueError("需要配置腾讯文档 Access Token")
            return await tencent_docs_test(cfg["access_token"])

        elif platform == "google_docs":
            sa_json = extra.get("service_account_json", "")
            if not sa_json:
                raise ValueError("需要在额外配置中填写 service_account_json")
            return await google_docs_test(sa_json)

        elif platform == "office365":
            tid = extra.get("tenant_id", "")
            cid = cfg.get("app_id", "")
            secret = cfg.get("app_secret", "")
            if not all([tid, cid, secret]):
                raise ValueError("需要配置 Tenant ID、App ID 和 App Secret")
            return await office365_test(tid, cid, secret)

        else:
            raise ValueError(f"未知平台: {platform}")

    except Exception as exc:
        log.warning("Integration test failed for %s: %s", platform, exc)
        raise


async def platform_send(cfg: dict, text: str) -> dict:
    """
    Send a text message via the configured platform.
    """
    platform = cfg["platform"]
    extra = _parse_extra(cfg.get("extra_config"))

    if platform == "wechat_work":
        return await wechat_work_send(cfg["webhook_url"], text)

    elif platform == "whatsapp":
        return await whatsapp_send(
            cfg["access_token"],
            extra.get("phone_number_id", ""),
            extra.get("test_recipient", ""),
            text,
        )

    elif platform == "feishu":
        return await feishu_send(cfg["webhook_url"], text)

    elif platform == "wps":
        return await wps_send_notify(cfg["access_token"], cfg["app_id"], "HR通知", text)

    elif platform == "tencent_docs":
        return await tencent_docs_send(cfg["access_token"], text)

    elif platform == "google_docs":
        sa_json = extra.get("service_account_json", "")
        return await google_docs_create(sa_json, "HR通知", text)

    elif platform == "office365":
        tid = extra.get("tenant_id", "")
        cid = cfg.get("app_id", "")
        secret = cfg.get("app_secret", "")
        team_id = extra.get("team_id", "")
        channel_id = extra.get("channel_id", "")
        return await office365_send_teams(tid, cid, secret, channel_id, team_id, text)

    else:
        raise ValueError(f"未知平台: {platform}")
