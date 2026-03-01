const { sequelize } = require('../src/config/database');

async function cleanupSlots(options = {}) {
  const { days = 0, dryRun = false } = options;
  
  try {
    console.log('🔍 Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение успешно установлено');

    let query;
    let countQuery;

    if (days > 0) {
      // Удаляем слоты старше указанного количества дней
      countQuery = `
        SELECT COUNT(*) as count 
        FROM booking_schema.slots 
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `;
      
      query = `
        DELETE FROM booking_schema.slots 
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `;
    } else {
      // Удаляем слоты, у которых created_at старше текущего дня (прошедшие дни)
      countQuery = `
        SELECT COUNT(*) as count 
        FROM booking_schema.slots 
        WHERE DATE(created_at) < CURRENT_DATE
      `;
      
      query = `
        DELETE FROM booking_schema.slots 
        WHERE DATE(created_at) < CURRENT_DATE
      `;
    }

    // Получаем количество записей для удаления
    console.log('📊 Подсчёт записей для удаления...');
    const [countResult] = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const count = parseInt(countResult.count, 10);
    console.log(`📋 Найдено записей для удаления: ${count}`);

    if (count === 0) {
      console.log('✅ Старых слотов не найдено');
      return { deleted: 0 };
    }

    if (dryRun) {
      console.log('🧪 Тестовый режим - записи не удаляются');
      return { deleted: count, dryRun: true };
    }

    // Удаляем записи
    console.log('🗑️  Удаление старых слотов...');
    const [result] = await sequelize.query(query, {
      type: sequelize.QueryTypes.DELETE
    });

    console.log(`✅ Удалено записей: ${result}`);
    
    return { deleted: result };
  } catch (error) {
    console.error('❌ Ошибка при очистке слотов:', error.message);
    throw error;
  } finally {
    console.log('🔌 Закрытие подключения к базе данных...');
    await sequelize.close();
    console.log('✅ Подключение закрыто');
  }
}

// Парсинг аргументов командной строки
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
}

// Запуск скрипта
(async () => {
  const options = parseArgs();
  
  console.log('🚀 Запуск очистки старых слотов...');
  console.log('📅 Параметры:', JSON.stringify(options));
  console.log('─'.repeat(50));

  try {
    const result = await cleanupSlots(options);
    console.log('─'.repeat(50));
    console.log('🎉 Очистка завершена успешно!');
    if (result.dryRun) {
      console.log(`📊 Будет удалено записей: ${result.deleted}`);
    } else {
      console.log(`📊 Удалено записей: ${result.deleted}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('─'.repeat(50));
    console.error('💥 Ошибка выполнения:', error.message);
    process.exit(1);
  }
})();
