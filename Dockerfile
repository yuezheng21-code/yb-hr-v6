FROM python:3.11.8-slim
WORKDIR /app

# Install Node.js for JSX pre-compilation and JS library bundling
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p uploads static && chmod +x start.sh

# Use npm to reliably obtain React/ReactDOM UMD files and compile JSX.
# This avoids any runtime CDN dependency, fixing the infinite loading screen.
RUN npm install --no-save react@18.2.0 react-dom@18.2.0 @babel/core@7 @babel/preset-react@7 @babel/preset-env@7 && \
    cp node_modules/react/umd/react.production.min.js static/react.production.min.js && \
    cp node_modules/react-dom/umd/react-dom.production.min.js static/react-dom.production.min.js && \
    node -e "
      try {
        const Babel = require('@babel/core');
        const fs = require('fs');
        const jsx = fs.readFileSync('static/app.jsx', 'utf8');
        const result = Babel.transformSync(jsx, {
          presets: [
            ['@babel/preset-env', {targets: {browsers: ['last 2 versions']}, modules: false}],
            '@babel/preset-react'
          ],
          compact: false
        });
        fs.writeFileSync('static/app.js', result.code);
        console.log('JSX compiled to static/app.js (' + result.code.length + ' bytes)');
      } catch (err) {
        console.error('JSX compilation failed: ' + err.message);
        process.exit(1);
      }
    " && \
    rm -rf node_modules package-lock.json
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 8000
CMD ["sh", "start.sh"]
