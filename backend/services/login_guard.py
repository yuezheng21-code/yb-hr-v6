"""
渊博579 HR V7 — 登录失败限流（进程内）

防止对用户名密码 / 4 位 PIN 的暴力尝试：同一来源在窗口期内失败次数达到上限后，
暂时拒绝登录（HTTP 429）。成功登录会清除该来源的失败记录。
Railway 等反向代理会把真实客户端地址追加到 X-Forwarded-For 末尾（前面的部分可被客户端伪造），
因此取最后一个地址识别来源。
"""
from __future__ import annotations
import threading
import time
from fastapi import HTTPException, Request

WINDOW_SECONDS = 15 * 60
MAX_FAILURES = 10

_lock = threading.Lock()
_failures: dict[str, list[float]] = {}


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _recent(key: str, now: float) -> list[float]:
    hits = [t for t in _failures.get(key, []) if now - t < WINDOW_SECONDS]
    if hits:
        _failures[key] = hits
    else:
        _failures.pop(key, None)
    return hits


def check(key: str) -> None:
    now = time.time()
    with _lock:
        hits = _recent(key, now)
        if len(hits) >= MAX_FAILURES:
            wait = int(WINDOW_SECONDS - (now - hits[0])) // 60 + 1
            raise HTTPException(status_code=429, detail=f"登录失败次数过多，请 {wait} 分钟后再试")


def fail(key: str) -> None:
    with _lock:
        _failures.setdefault(key, []).append(time.time())


def success(key: str) -> None:
    with _lock:
        _failures.pop(key, None)
