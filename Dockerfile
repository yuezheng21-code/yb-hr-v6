# ── Stage 1: build the React + Vite frontend ─────────────────────────
# Uses the official Node image instead of installing Node via apt/NodeSource,
# so the build does not depend on Debian mirrors or a curl|bash installer.
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python runtime ──────────────────────────────────────────
FROM python:3.11.8-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
# backend/main.py serves frontend/dist when present
COPY --from=frontend /fe/dist ./frontend/dist
RUN mkdir -p uploads && chmod +x start.sh

EXPOSE 8000
CMD ["sh", "start.sh"]
