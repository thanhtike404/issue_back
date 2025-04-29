# -------- STAGE 1: Build Stage --------
FROM node:18-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ✅ Set DATABASE_URL for build-time migration
ARG DATABASE_URL
ENV DATABASE_URL="postgresql://admin:secret@postgres:5432/issue-back"

# ✅ Generate Prisma Client
RUN npx prisma generate

# ✅ Push DB changes (requires an accessible DB)
# RUN npx prisma db push 

# ✅ Build TypeScript project
RUN npm run build

# -------- STAGE 2: Production Stage --------
FROM node:18-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
EXPOSE 3000

CMD npx prisma migrate deploy && node dist/app.js
