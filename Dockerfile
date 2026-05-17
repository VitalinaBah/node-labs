# syntax=docker/dockerfile:1.6

# ============================================
# STAGE 1: builder — повний набір залежностей,
# тут можна запускати тести / лінт
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Системні залежності для argon2 (нативний C-модуль)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# ============================================
# STAGE 2: runner — мінімальний production-образ
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Тільки production-залежності
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
 && npm ci --omit=dev \
 && apk del python3 make g++

# Копіюємо вихідний код з builder
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/repositories ./repositories
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/schemas ./schemas
COPY --from=builder /app/constants ./constants
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/db ./db
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js

# Створюємо непривілейованого користувача — стандартна практика безпеки
RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p data/backups data/cache uploads \
 && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "server.js"]
