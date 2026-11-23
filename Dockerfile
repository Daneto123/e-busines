# 1) Сглобява Angular приложението
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Сървърът, който обслужва API-то и готовия сайт
FROM node:24-alpine
ENV NODE_ENV=production \
    DATA_DIR=/data \
    FRONTEND_DIR=/app/public
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist/frontend/browser /app/public
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 5200
CMD ["node", "src/server.js"]
