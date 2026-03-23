FROM python:3.11.8-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p uploads static && chmod +x start.sh
# Self-host JS libs so the app never depends on external CDNs
RUN python3 -c "import urllib.request; urllib.request.urlretrieve('https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js','static/react.production.min.js')" || true && \
    python3 -c "import urllib.request; urllib.request.urlretrieve('https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js','static/react-dom.production.min.js')" || true && \
    python3 -c "import urllib.request; urllib.request.urlretrieve('https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js','static/babel.min.js')" || true && \
    python3 -c "import os,sys; files=['static/react.production.min.js','static/react-dom.production.min.js','static/babel.min.js']; ok=[f for f in files if os.path.exists(f) and os.path.getsize(f)>1000]; missing=set(files)-set(ok); [print('WARN: '+f+' missing – will fall back to CDN',file=sys.stderr) for f in missing]; [print('OK: '+f) for f in ok]"
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 8000
CMD ["sh", "start.sh"]
