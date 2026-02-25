# Dependency installation stage
FROM node:24-alpine AS deps

WORKDIR /app
COPY shared shared
WORKDIR /app/shared
RUN npm ci
RUN npm run build

WORKDIR /app
COPY api/package*.json api/
WORKDIR /app/api
RUN npm ci

# Dependency installation stage for production
FROM node:24-alpine AS proddeps

WORKDIR /app
COPY api/package*.json api/
WORKDIR /app/api
RUN npm ci --omit=dev

# Build stage
FROM node:24-alpine AS build

WORKDIR /app
COPY --from=deps /app/shared shared
COPY api api
COPY --from=deps /app/api/node_modules api/node_modules

WORKDIR /app/api
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/prisma ./prisma
COPY --from=proddeps /app/api/node_modules ./node_modules

CMD ["node", "dist/index.js"]
