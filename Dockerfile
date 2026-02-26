# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm prune --production && \
    npm cache clean --force

FROM node:24-alpine

LABEL maintainer="Beauty Vite Team"
LABEL description="Backend API server for Beauty Vite application"
LABEL version="1.0"

RUN apk add --no-cache dumb-init && \
    npm install -g pm2 && \
    npm cache clean --force

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

COPY ecosystem.config.js ./


RUN adduser -D -u 1001 app-user && \
    chown -R app-user:app-user /app && \
    mkdir -p /app/uploads && \
    chown app-user:app-user /app/uploads && \
    mkdir -p /app/logs && \
    chown app-user:app-user /app/logs

USER app-user

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode===200?0:1)})" || exit 1

STOPSIGNAL SIGINT

ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "ecosystem.config.js"]
