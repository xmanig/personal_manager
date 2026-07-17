# Frontend build stage
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Backend build stage
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/prisma ./backend/prisma
COPY --from=backend-build /app/backend/prisma.config.ts ./backend/prisma.config.ts
COPY --from=backend-build /app/backend/google-credentials.json ./backend/google-credentials.json
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY backend/docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

WORKDIR /app/backend

EXPOSE 3001

CMD ["../docker-entrypoint.sh"]
