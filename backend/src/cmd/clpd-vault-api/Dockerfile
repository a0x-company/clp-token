# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
WORKDIR /app

# Crear un usuario no root
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app

COPY --from=build --chown=appuser:appuser /app/package*.json ./
COPY --from=build --chown=appuser:appuser /app/dist ./dist
EXPOSE 8080

# Instalar dependencias necesarias para el navegador
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar variables de entorno para Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Instalar dependencias de producción
RUN npm install --only=production --no-cache && npm cache clean --force

# Configurar argumentos para Puppeteer
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage"

# Cambiar al usuario no root
USER appuser

# Usar un shell para asegurar que la variable APP_NAME se expanda correctamente
CMD ["sh", "-c", "node dist/cmd/${APP_NAME}/index.js"]