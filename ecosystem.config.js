/**
 * PM2 Ecosystem Configuration
 * 
 * Конфигурация для кластерного режима работы Node.js приложения
 * Документация: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    {
      // Имя приложения в PM2
      name: 'beauty-vite-api',
      
      // Точка входа приложения
      script: 'src/server.js',
      
      // Количество воркеров (фиксировано под CPU limit 2.0 в docker-compose)
      // Измените это значение если меняете deploy.resources.limits.cpus
      instances: 2,
      
      // Кластерный режим для использования всех воркеров
      exec_mode: 'cluster',
      
      // Переменные окружения для production
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Graceful shutdown настройки
      // Время ожидания перед принудительным завершением
      kill_timeout: 3000,
      
      // Ожидать пока приложение станет готовым перед следующим воркером
      wait_ready: true,
      
      // Таймаут ожидания готовности приложения
      listen_timeout: 5000,
      
      // Максимальное количество перезапусков за 1 минуту
      max_restarts: 10,
      
      // Минимальное время между перезапусками (мс)
      min_uptime: '10s',
      
      // Автоматический перезапуск при падении
      autorestart: true,
      
      // Логирование
      // Формат логов: combined (Apache-style)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Файлы логов (опционально, по умолчанию stdout/stderr)
      // error_file: './logs/pm2-err.log',
      // out_file: './logs/pm2-out.log',
      // merge_logs: true,
      
      // Максимальный размер файла лога перед ротацией
      // max_size: '10M',
      
      // Предотвращение перезапуска после определённого количества рестартов
      // restart_delay: 4000,
      
      // Watch за изменениями файлов (отключено в production)
      watch: false,
      
      // Игнорируемые файлы для watch
      // ignore_watch: ['node_modules', 'logs', 'uploads', '*.log'],
      
      // Максимальное использование памяти для автоматического рестарта
      // max_memory_restart: '500M',
      
      // Source map поддержка
      // source_map_support: true,
      
      // Disable source map warning
      // disable_source_map_support: false,
      
      // Контекст приложения (для reverse proxy)
      // cwd: '/app',
      
      // Force stable instance count (для Kubernetes)
      // node_args: '--max-old-space-size=512',
      
      // Интерпретатор
      // interpreter: 'node',
      
      // Интерпретатор аргументы
      // interpreter_args: '--max-old-space-size=512',
    }
  ]
};
