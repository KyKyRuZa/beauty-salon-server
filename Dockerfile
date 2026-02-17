FROM node:24-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Удаление dev зависимостей
RUN npm prune --production

# Финальный образ
FROM node:24-alpine

WORKDIR /app

# Установка зависимостей для работы приложения
RUN apk add --no-cache dumb-init

# Копирование приложения и зависимостей из builder-образа
COPY --from=builder /app ./

EXPOSE 5000

# Запуск приложения через dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]