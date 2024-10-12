# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install -g npm@latest
RUN npm config set fetch-retry-maxtimeout 600000
RUN npm config set fetch-timeout 600000
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --only=production --prefer-offline
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app

# Instalar herramientas necesarias
RUN apk add --no-cache bash curl python3 jq chromium

# Instalar Google Cloud SDK
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/usr/local
ENV PATH=$PATH:/usr/local/google-cloud-sdk/bin

# Copiar y configurar la clave GCP
ARG GCP_KEY_PATH
COPY ${GCP_KEY_PATH} /app/gcp-key.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-key.json

# Copiar archivos de la aplicación
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser


# Crear script de inicio
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Activating application default credentials..."' >> /app/start.sh && \
    echo 'gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS' >> /app/start.sh && \
    echo 'echo "Project ID: $GOOGLE_CLOUD_PROJECT"' >> /app/start.sh && \
    echo 'echo "GOOGLE_APPLICATION_CREDENTIALS: $GOOGLE_APPLICATION_CREDENTIALS"' >> /app/start.sh && \
    echo 'echo "Current working directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "Files in current directory: $(ls -la)"' >> /app/start.sh && \
    echo 'echo "GCP Key contents:"' >> /app/start.sh && \
    echo 'cat $GOOGLE_APPLICATION_CREDENTIALS' >> /app/start.sh && \
    echo 'echo "Running application..."' >> /app/start.sh && \
    echo 'node dist/cmd/${APP_NAME}/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Ejecutar el script de inicio
CMD ["/app/start.sh"]