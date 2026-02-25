# Dependency installation stage
FROM node:24-alpine AS deps

WORKDIR /app
COPY api/package*.json api/

WORKDIR /app/api
RUN npm ci

# Build stage
FROM node:24-alpine AS build

WORKDIR /app
COPY api/prisma/schema.prisma prisma/schema.prisma
COPY --from=deps /app/api/node_modules node_modules

RUN npx prisma generate 
RUN npx prisma migrate diff \
      --from-empty \
      --to-schema-datamodel prisma/schema.prisma \ 
      --script > migration.sql

# Production stage
FROM postgres:17-alpine
COPY --from=build /app/migration.sql /docker-entrypoint-initdb.d/001_init.sql

CMD ["postgres"]
