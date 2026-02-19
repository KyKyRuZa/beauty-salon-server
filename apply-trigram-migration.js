/**
 * Скрипт применения миграции для GIN-индексов (триграммы)
 * Запуск: node apply-trigram-migration.js
 */

const { sequelize } = require('./src/config/database');

async function applyTrigramMigration() {
  console.log('🚀 Применение миграции для GIN-индексов (триграммы)...\n');

  try {
    // Проверяем, что pg_trgm включен
    console.log('📋 Проверка расширения pg_trgm...');
    const [pgTrgmCheck] = await sequelize.query(`
      SELECT * FROM pg_extension WHERE extname = 'pg_trgm'
    `);
    
    if (pgTrgmCheck.length === 0) {
      console.log('⚠️  Расширение pg_trgm не найдено! Создаем...');
      await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      console.log('✅ Расширение pg_trgm создано\n');
    } else {
      console.log('✅ Расширение pg_trgm уже установлено\n');
    }

    // Создаем индексы
    console.log('📁 Создание GIN-индексов...\n');

    const indexes = [
      {
        name: 'idx_categories_name_trgm',
        table: 'catalog_schema.service_categories',
        column: 'name'
      },
      {
        name: 'idx_subcategories_name_trgm',
        table: 'catalog_schema.service_subcategories',
        column: 'name'
      },
      {
        name: 'idx_master_services_name_trgm',
        table: 'catalog_schema.master_services',
        column: 'name'
      },
      {
        name: 'idx_masters_first_name_trgm',
        table: 'user_schema.masters',
        column: 'first_name'
      },
      {
        name: 'idx_masters_last_name_trgm',
        table: 'user_schema.masters',
        column: 'last_name'
      },
      {
        name: 'idx_masters_specialization_trgm',
        table: 'user_schema.masters',
        column: 'specialization'
      },
      {
        name: 'idx_salons_name_trgm',
        table: 'user_schema.salons',
        column: 'name'
      }
    ];

    for (const index of indexes) {
      try {
        console.log(`   Creating index ${index.name}...`);
        
        await sequelize.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON ${index.table}
          USING gin (${index.column} gin_trgm_ops)
        `);
        
        console.log(`   ✅ Index ${index.name} created\n`);
      } catch (error) {
        console.error(`   ❌ Error creating index ${index.name}:`, error.message);
      }
    }

    // Проверяем созданные индексы
    console.log('\n📊 Проверка созданных индексов...');
    const [indexList] = await sequelize.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE '%trgm%'
      ORDER BY tablename, indexname
    `);

    console.log(`\n✅ Создано GIN-индексов: ${indexList.length}\n`);
    
    if (indexList.length > 0) {
      console.log('Список индексов:');
      indexList.forEach(idx => {
        console.log(`   - ${idx.indexname} (${idx.tablename})`);
      });
    }

    console.log('\n🎉 Миграция успешно применена!');
    console.log('\n💡 Теперь вы можете использовать поиск с опечатками:');
    console.log('   GET /api/catalog/search/categories?q=маник');
    console.log('   GET /api/catalog/search/services?q=стрижк');
    console.log('   GET /api/catalog/search/masters?q=екатер');

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

applyTrigramMigration();
