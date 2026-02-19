const { sequelize } = require('./src/config/database');
const User = require('./src/modules/user/models/User');
const Client = require('./src/modules/user/models/Client');
const Master = require('./src/modules/user/models/Master');
const Salon = require('./src/modules/user/models/Salon');
const Admin = require('./src/modules/admin/models/Admin');
const ServiceCategory = require('./src/modules/catalog/models/ServiceCategory');
const ServiceSubcategory = require('./src/modules/catalog/models/ServiceSubcategory');
const MasterService = require('./src/modules/catalog/models/MasterService');
const MasterSkill = require('./src/modules/user/models/MasterSkill');
const MasterPortfolio = require('./src/modules/user/models/MasterPortfolio');
const bcrypt = require('bcrypt');

async function seedTestData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено.\n');

    
    console.log('🗑️  Очистка базы данных...');
    await MasterPortfolio.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await MasterSkill.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await MasterService.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await ServiceSubcategory.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await ServiceCategory.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Admin.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Client.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Master.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Salon.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, force: true });
    console.log('✅ База данных очищена.\n');

    const testData = {
      users: [
        
        {
          phone: '+7 (495) 000-00-01',
          email: 'admin@beauty-vite.ru',
          password: 'AdminPass123!',
          role: 'admin',
          isActive: true
        },
        
        {
          phone: '+7 (495) 123-45-67',
          email: 'ivan.petrov@example.com',
          password: 'ClientPass123!',
          role: 'client',
          isActive: true
        },
        {
          phone: '+7 (495) 234-56-78',
          email: 'maria.sidorova@example.com',
          password: 'ClientPass456!',
          role: 'client',
          isActive: true
        },
        {
          phone: '+7 (495) 345-67-89',
          email: 'anna.kuznetsova@example.com',
          password: 'ClientPass789!',
          role: 'client',
          isActive: true
        },
        
        {
          phone: '+7 (495) 456-78-90',
          email: 'ekaterina.volkova@example.com',
          password: 'MasterPass123!',
          role: 'master',
          isActive: true
        },
        {
          phone: '+7 (495) 567-89-01',
          email: 'olga.novikova@example.com',
          password: 'MasterPass456!',
          role: 'master',
          isActive: true
        },
        {
          phone: '+7 (495) 678-90-12',
          email: 'dmitry.sokolov@example.com',
          password: 'MasterPass789!',
          role: 'master',
          isActive: true
        },
        
        {
          phone: '+7 (495) 789-01-23',
          email: 'beauty.salon@example.com',
          password: 'SalonPass123!',
          role: 'salon',
          isActive: true
        },
        {
          phone: '+7 (495) 890-12-34',
          email: 'style.house@example.com',
          password: 'SalonPass456!',
          role: 'salon',
          isActive: true
        }
      ],
      admins: [
        {
          user_id: 1,
          role: 'super_admin',
          permissions: { all: true },
          first_name: 'Александр',
          last_name: 'Админов',
          is_active: true
        }
      ],
      clients: [
        {
          first_name: 'Иван',
          last_name: 'Петров',
          image_url: 'https://i.pravatar.cc/300?img=11'
        },
        {
          first_name: 'Мария',
          last_name: 'Сидорова',
          image_url: 'https://i.pravatar.cc/300?img=5'
        },
        {
          first_name: 'Анна',
          last_name: 'Кузнецова',
          image_url: 'https://i.pravatar.cc/300?img=9'
        }
      ],
      masters: [
        {
          first_name: 'Екатерина',
          last_name: 'Волкова',
          specialization: 'Парикмахер-стилист, колорист',
          experience: 7,
          bio: 'Топ-стилист с опытом работы более 7 лет. Специализируюсь на сложных окрашиваниях и стрижках.',
          image_url: 'https://i.pravatar.cc/300?img=5',
          is_available: true,
          address: 'г. Москва, ул. Тверская, д. 15',
          has_training: true,
          rating: 4.9
        },
        {
          first_name: 'Ольга',
          last_name: 'Новикова',
          specialization: 'Мастер маникюра и педикюра',
          experience: 5,
          bio: 'Сертифицированный мастер ногтевого сервиса. Работаю на материалах премиум-класса.',
          image_url: 'https://i.pravatar.cc/300?img=9',
          is_available: true,
          address: 'г. Москва, ул. Арбат, д. 25',
          has_training: false,
          rating: 4.8
        },
        {
          first_name: 'Дмитрий',
          last_name: 'Соколов',
          specialization: 'Барбер, мужской мастер',
          experience: 4,
          bio: 'Профессиональный барбер. Создаю стильные мужские стрижки и бороды.',
          image_url: 'https://i.pravatar.cc/300?img=13',
          is_available: true,
          address: 'г. Москва, ул. Лесная, д. 5',
          has_training: false,
          rating: 4.7
        }
      ],
      salons: [
        {
          name: 'Beauty Salon & Spa',
          description: 'Современный салон красоты с широким спектром услуг: парикмахерский зал, ногтевой сервис, косметология, СПА.',
          address: 'г. Москва, ул. Тверская, д. 1',
          inn: '1234567890',
          image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
          rating: 4.8
        },
        {
          name: 'Style House',
          description: 'Элитный салон красоты с индивидуальным подходом к каждому клиенту. Премиум косметика и топ-мастера.',
          address: 'г. Москва, ул. Арбат, д. 10',
          inn: '0987654321',
          image_url: 'https://images.unsplash.com/photo-1521590832169-d7fcbe215a3e?w=500',
          rating: 4.9
        }
      ],
      categories: [
        { name: 'Парикмахерские услуги', description: 'Стрижки, укладки, окрашивание волос' },
        { name: 'Ногтевой сервис', description: 'Маникюр, педикюр, дизайн ногтей' },
        { name: 'Брови и ресницы', description: 'Коррекция бровей, ламинирование ресниц' },
        { name: 'Визаж', description: 'Дневной и вечерний макияж' },
        { name: 'Косметология', description: 'Уход за лицом и телом' },
        { name: 'Массаж', description: 'Все виды массажа' }
      ],
      masterServices: [
        
        {
          name: 'Стрижка женская (любая длина)',
          description: 'Стрижка с мытьем головы и укладкой',
          price: 2500,
          duration: 60,
          category_index: 0
        },
        {
          name: 'Окрашивание волос (один тон)',
          description: 'Окрашивание волос профессиональными красителями',
          price: 4500,
          duration: 120,
          category_index: 0
        },
        {
          name: 'Сложное окрашивание (Airtouch, Balayage)',
          description: 'Многоступенчатое окрашивание с эффектом выгоревших волос',
          price: 8000,
          duration: 240,
          category_index: 0
        },
        {
          name: 'Вечерняя укладка',
          description: 'Праздничная укладка с использованием стайлинговых средств',
          price: 3000,
          duration: 90,
          category_index: 0
        },
        
        {
          name: 'Маникюр комбинированный с покрытием',
          description: 'Комбинированный маникюр + покрытие гель-лак',
          price: 2000,
          duration: 90,
          category_index: 1
        },
        {
          name: 'Маникюр аппаратный с покрытием',
          description: 'Аппаратный маникюр + покрытие гель-лак',
          price: 1800,
          duration: 90,
          category_index: 1
        },
        {
          name: 'Педикюр полный (пальчики + стопа)',
          description: 'Обработка пальчиков и стопы с покрытием',
          price: 2500,
          duration: 120,
          category_index: 1
        },
        {
          name: 'Дизайн ногтей (френч/лунки)',
          description: 'Французский маникюр или лунный дизайн',
          price: 500,
          duration: 30,
          category_index: 1
        },
        
        {
          name: 'Мужская стрижка',
          description: 'Стрижка с мытьем головы и укладкой',
          price: 1800,
          duration: 60,
          category_index: 0
        },
        {
          name: 'Стрижка бороды и усов',
          description: 'Моделирование и оформление бороды',
          price: 1000,
          duration: 30,
          category_index: 0
        },
        {
          name: 'Комплекс (стрижка + борода)',
          description: 'Мужская стрижка + оформление бороды',
          price: 2500,
          duration: 90,
          category_index: 0
        }
      ],
      masterSkills: [
        
        { name: 'Укладка и причёски', sort_order: 1 },
        { name: 'Ламинирование и ботокс волос', sort_order: 2 },
        { name: 'Лечение волос и кожи головы', sort_order: 3 },
        { name: 'Сложные окрашивания', sort_order: 4 },
        { name: 'Стрижки любой сложности', sort_order: 5 },
        
        { name: 'Маникюр без покрытия', sort_order: 1 },
        { name: 'Маникюр с покрытием', sort_order: 2 },
        { name: 'Педикюр пальчики без покрытия', sort_order: 3 },
        { name: 'Дизайн ногтей', sort_order: 4 },
        { name: 'Ремонт одного ногтя', sort_order: 5 },
        { name: 'SPA-уход для рук и ног', sort_order: 6 },
        
        { name: 'Мужские стрижки', sort_order: 1 },
        { name: 'Оформление бороды', sort_order: 2 },
        { name: 'Камуфляж седины', sort_order: 3 },
        { name: 'Детская стрижка', sort_order: 4 }
      ],
      masterPortfolio: [
        
        {
          title: 'Сложное окрашивание Airtouch',
          description: 'Многоступенчатое окрашивание с растяжкой цвета',
          image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
          category: 'Окрашивание',
          service_type: 'Airtouch',
          is_featured: true,
          is_visible: true
        },
        {
          title: 'Вечерняя прическа',
          description: 'Локоны с объемом у корней',
          image_url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b5?w=500',
          category: 'Прически',
          service_type: 'Укладка',
          is_featured: true,
          is_visible: true
        },
        
        {
          title: 'Французский маникюр',
          description: 'Классический френч с нюдовой подложкой',
          image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500',
          category: 'Маникюр',
          service_type: 'Френч',
          is_featured: true,
          is_visible: true
        },
        {
          title: 'Яркий дизайн с геометрий',
          description: 'Маникюр с геометрическим дизайном',
          image_url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=500',
          category: 'Дизайн',
          service_type: 'Гель-лак',
          is_featured: false,
          is_visible: true
        },
        {
          title: 'Педикюр с покрытием',
          description: 'Полный педикюр с покрытием гель-лак',
          image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500',
          category: 'Педикюр',
          service_type: 'Педикюр',
          is_featured: false,
          is_visible: true
        }
      ]
    };

    
    console.log('👥 Создание пользователей...');
    const createdUsers = [];
    for (const userData of testData.users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✓ ${user.email} (${user.role})`);
    }

    
    console.log('\n👨‍💼 Создание администратора...');
    for (const adminData of testData.admins) {
      
      const adminUser = createdUsers.find(u => u.email === 'admin@beauty-vite.ru');
      if (adminUser) {
        const admin = await Admin.create({ ...adminData, user_id: adminUser.id });
        console.log(`   ✓ ${admin.first_name} ${admin.last_name} (${admin.role})`);
      }
    }

    
    console.log('\n👤 Создание клиентов...');
    for (let i = 0; i < testData.clients.length; i++) {
      const clientData = { ...testData.clients[i], user_id: createdUsers[1 + i].id };
      const client = await Client.create(clientData);
      console.log(`   ✓ ${client.first_name} ${client.last_name}`);
    }

    
    console.log('\n🏢 Создание салонов...');
    const createdSalons = [];
    for (let i = 0; i < testData.salons.length; i++) {
      const salonData = { ...testData.salons[i], user_id: createdUsers[5 + i].id };
      const salon = await Salon.create(salonData);
      createdSalons.push(salon);
      console.log(`   ✓ ${salon.name}`);
    }

    
    console.log('\n💇‍♀️ Создание мастеров...');
    const createdMasters = [];
    for (let i = 0; i < testData.masters.length; i++) {
      const masterData = { ...testData.masters[i], user_id: createdUsers[2 + i].id };
      
      if (createdSalons[i % createdSalons.length]) {
        masterData.salon_id = createdSalons[i % createdSalons.length].id;
      }
      const master = await Master.create(masterData);
      createdMasters.push(master);
      console.log(`   ✓ ${master.first_name} ${master.last_name} (${master.specialization})`);
    }

    
    console.log('\n📁 Создание категорий...');
    const createdCategories = [];
    for (const categoryData of testData.categories) {
      const category = await ServiceCategory.create(categoryData);
      createdCategories.push(category);
      console.log(`   ✓ ${category.name}`);
    }

    
    console.log('\n💰 Создание услуг мастеров...');
    const serviceConfigs = [
      { masterIndex: 0, services: testData.masterServices.slice(0, 4) },    
      { masterIndex: 1, services: testData.masterServices.slice(4, 8) },    
      { masterIndex: 2, services: testData.masterServices.slice(8, 11) }    
    ];
    
    for (const { masterIndex, services } of serviceConfigs) {
      const master = createdMasters[masterIndex];
      for (const serviceData of services) {
        const category = createdCategories[serviceData.category_index];
        const service = await MasterService.create({
          ...serviceData,
          master_id: master.id,
          category_id: category.id
        });
        console.log(`   ✓ ${master.first_name}: ${service.name} - ${service.price}₽`);
      }
    }

    
    console.log('\n⭐ Создание навыков мастеров...');
    const skillConfigs = [
      { masterIndex: 0, count: 5 },  
      { masterIndex: 1, count: 6 },  
      { masterIndex: 2, count: 4 }   
    ];
    
    let skillOffset = 0;
    for (const { masterIndex, count } of skillConfigs) {
      const master = createdMasters[masterIndex];
      for (let i = 0; i < count; i++) {
        const skillData = testData.masterSkills[skillOffset + i];
        await MasterSkill.create({
          ...skillData,
          master_id: master.id
        });
      }
      skillOffset += count;
    }
    const masterSkillCount = await MasterSkill.count();
    console.log(`   ✓ Создано навыков: ${masterSkillCount}`);

    
    console.log('\n🖼️ Создание портфолио мастеров...');
    const portfolioConfigs = [
      { masterIndex: 0, count: 2 },  
      { masterIndex: 1, count: 3 }   
    ];
    
    let portfolioOffset = 0;
    for (const { masterIndex, count } of portfolioConfigs) {
      const master = createdMasters[masterIndex];
      for (let i = 0; i < count; i++) {
        const portfolioData = testData.masterPortfolio[portfolioOffset + i];
        await MasterPortfolio.create({
          ...portfolioData,
          master_id: master.id
        });
      }
      portfolioOffset += count;
    }
    const portfolioCount = await MasterPortfolio.count();
    console.log(`   ✓ Создано работ в портфолио: ${portfolioCount}`);

    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ТЕСТОВЫЕ ДАННЫЕ УСПЕШНО СОЗДАНЫ!');
    console.log('='.repeat(60));
    console.log('\n📧 УЧЕТНЫЕ ЗАПИСИ:');
    console.log('\n🔐 АДМИНИСТРАТОР:');
    console.log('   Email: admin@beauty-vite.ru');
    console.log('   Пароль: AdminPass123!');
    
    console.log('\n👤 КЛИЕНТЫ:');
    console.log('   ivan.petrov@example.com / ClientPass123!');
    console.log('   maria.sidorova@example.com / ClientPass456!');
    console.log('   anna.kuznetsova@example.com / ClientPass789!');
    
    console.log('\n💇‍♀️ МАСТЕРА:');
    console.log('   ekaterina.volkova@example.com / MasterPass123! (Парикмахер)');
    console.log('   olga.novikova@example.com / MasterPass456! (Маникюр)');
    console.log('   dmitry.sokolov@example.com / MasterPass789! (Барбер)');
    
    console.log('\n🏢 САЛОНЫ:');
    console.log('   beauty.salon@example.com / SalonPass123!');
    console.log('   style.house@example.com / SalonPass456!');
    
    console.log('\n📊 СТАТИСТИКА:');
    console.log(`   Пользователей: ${createdUsers.length}`);
    console.log(`   Клиентов: ${testData.clients.length}`);
    console.log(`   Мастеров: ${createdMasters.length}`);
    console.log(`   Салонов: ${createdSalons.length}`);
    console.log(`   Категорий: ${createdCategories.length}`);
    console.log(`   Услуг мастеров: ${testData.masterServices.length}`);
    console.log(`   Навыков: ${masterSkillCount}`);
    console.log(`   Работ в портфолио: ${portfolioCount}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

seedTestData();
