"""
渊博579 HR V7 — 文件存储

文件内容存在数据库 file_blobs 表（Railway 容器无持久磁盘）。
限制类型与大小；按 SHA-256 记录指纹，便于核对文件是否被替换。
"""
from __future__ import annotations
import hashlib
import mimetypes
import os
from typing import Optional
from fastapi import HTTPException, UploadFile
from fastapi.responses import Response
from urllib.parse import quote
from sqlalchemy.orm import Session
from backend.models.personnel import FileBlob

MAX_BYTES = 15 * 1024 * 1024
ALLOWED_EXT = {
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".gif",
    ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".odt", ".ods",
    ".ppt", ".pptx", ".mp4", ".mov",
}
# Signatures for formats where a renamed file would be dangerous to open
_MAGIC = {
    ".pdf": [b"%PDF"],
    ".png": [b"\x89PNG"],
    ".jpg": [b"\xff\xd8\xff"], ".jpeg": [b"\xff\xd8\xff"],
    ".docx": [b"PK\x03\x04"], ".xlsx": [b"PK\x03\x04"], ".pptx": [b"PK\x03\x04"],
}


def _clean_name(name: str) -> str:
    base = os.path.basename(name or "file").replace("\\", "_").strip() or "file"
    return base[:200]


def store_bytes(db: Session, data: bytes, filename: str, content_type: Optional[str], user_name: str) -> FileBlob:
    name = _clean_name(filename)
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"不支持的文件类型 {ext or '(无扩展名)'}；允许：PDF、图片、Office 文档、CSV/TXT、视频")
    if not data:
        raise HTTPException(400, "文件为空")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"文件过大（上限 {MAX_BYTES // 1024 // 1024}MB）")
    sigs = _MAGIC.get(ext)
    if sigs and not any(data.startswith(s) for s in sigs):
        raise HTTPException(400, f"文件内容与扩展名 {ext} 不符")
    ctype = mimetypes.guess_type(name)[0] or content_type or "application/octet-stream"
    blob = FileBlob(filename=name, content_type=ctype, size=len(data), sha256=hashlib.sha256(data).hexdigest(),
                    data=data, uploaded_by=user_name)
    db.add(blob)
    db.flush()
    return blob


async def store_upload(db: Session, upload: UploadFile, user_name: str) -> FileBlob:
    data = await upload.read(MAX_BYTES + 1)
    return store_bytes(db, data, upload.filename or "file", upload.content_type, user_name)


def file_response(blob: FileBlob, inline: bool = False) -> Response:
    disp = "inline" if inline and blob.content_type in ("application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif", "text/plain") else "attachment"
    return Response(
        content=blob.data, media_type=blob.content_type,
        headers={
            "Content-Disposition": f"{disp}; filename*=UTF-8''{quote(blob.filename)}",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


def blob_meta(blob: Optional[FileBlob]) -> Optional[dict]:
    if blob is None:
        return None
    return {"id": blob.id, "filename": blob.filename, "content_type": blob.content_type, "size": blob.size,
            "sha256": blob.sha256, "created_at": blob.created_at}
