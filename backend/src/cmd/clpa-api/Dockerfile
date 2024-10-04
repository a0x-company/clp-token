# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
ARG APP_NAME
ENV APP_NAME ${APP_NAME}
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
EXPOSE 8080
RUN npm install --only=production --no-cache && npm cache clean --force
CMD node dist/cmd/${APP_NAME}/index.js