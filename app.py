"""
渊博+579 HR V6 — 兼容入口
主实现已迁移到 backend/。此文件仅作向后兼容保留，
直接 re-export backend.main:app 以确保任何仍引用 app:app 的启动命令
继续正常工作。
"""
from backend.main import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn, os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
