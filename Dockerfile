FROM python:3.11.8-slim
WORKDIR /app

# Install Node.js 20.x (LTS) via NodeSource — ensures Vite 5 compatibility
# regardless of which Debian release the python:slim image uses.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p uploads static && chmod +x start.sh

# Build the React + Vite frontend → output lands in frontend/dist/
# backend/main.py auto-detects frontend/dist and serves it instead of legacy static/
RUN cd frontend && npm ci && npm run build && rm -rf node_modules

ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 8000
CMD ["sh", "start.sh"]
