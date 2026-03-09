const { sequelize } = require('../src/config/database');

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено.\n');

    console.log('🗑️  Очистка базы данных...');
    const models = [
      { name: 'booking', model: require('../src/modules/booking/models/Booking') },
      { name: 'slots', model: require('../src/modules/booking/models/TimeSlot') },
      { name: 'master_availability', model: require('../src/modules/booking/models/MasterAvailability') },
      { name: 'master_portfolio', model: require('../src/modules/user/models/MasterPortfolio') },
      { name: 'master_skills', model: require('../src/modules/user/models/MasterSkill') },
      { name: 'master_services', model: require('../src/modules/catalog/models/MasterService') },
      { name: 'service_categories', model: require('../src/modules/catalog/models/ServiceCategory') },
      { name: 'admins', model: require('../src/modules/admin/models/Admin') },
      { name: 'clients', model: require('../src/modules/user/models/Client') },
      { name: 'masters', model: require('../src/modules/user/models/Master') },
      { name: 'salons', model: require('../src/modules/user/models/Salon') },
      { name: 'users', model: require('../src/modules/user/models/User') },
      { name: 'salon_locations', model: require('../src/modules/user/models/SalonLocation') },
      { name: 'favorites', model: require('../src/modules/user/models/Favorite') },
      { name: 'reviews', model: require('../src/modules/user/models/Review') }
    ];

    for (const { name, model } of models) {
      await model.destroy({ where: {}, truncate: true, cascade: true, force: true });
      console.log(`   ✓ ${name} очищен`);
    }

    console.log('\n🔄 Сброс последовательностей (ID)...');
    const fs = require('fs');
    const path = require('path');
    const resetSqlPath = path.join(__dirname, 'reset_sequences.sql');
    
    try {
      const resetSql = fs.readFileSync(resetSqlPath, 'utf8');
      const queries = resetSql.split(';').filter(q => q.trim() && !q.trim().startsWith('--'));
      
      for (const query of queries) {
        if (query.trim().startsWith('SELECT setval')) {
          await sequelize.query(query);
        }
      }
      console.log('   ✓ Все ID сброшены к 1\n');
    } catch (error) {
      console.log('   ⚠ Ошибка сброса последовательностей:', error.message, '\n');
    }

    console.log('✅ База данных очищена и готова к заполнению.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

resetDatabase();
