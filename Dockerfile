FROM python:3.11.8-slim
WORKDIR /app

# Install Node.js for building the Vite frontend
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm && rm -rf /var/lib/apt/lists/*

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
