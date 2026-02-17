const { sequelize } = require('./src/config/database');
const User = require('./src/modules/user/models/User');
const Client = require('./src/modules/user/models/Client');
const Master = require('./src/modules/user/models/Master');
const Salon = require('./src/modules/user/models/Salon');
const bcrypt = require('bcrypt');

async function seedTestData() {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    // Очищаем существующие данные (в правильном порядке из-за внешних ключей)
    // Используем force: true для обхода мягкого удаления (paranoid)
    await Client.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Master.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await Salon.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, force: true });

    // Тестовые данные
    const testData = {
      users: [
        {
          phone: '+7 (495) 123-45-67',
          email: 'ivan.petrov@example.com',
          password: 'StrongPass123',
          role: 'client',
          isActive: true
        },
        {
          phone: '+7 (495) 234-56-78',
          email: 'maria.sidorova@example.com',
          password: 'SecurePass456',
          role: 'client',
          isActive: true
        },
        {
          phone: '+7 (495) 345-67-89',
          email: 'aleksey.ivanov@example.com',
          password: 'ComplexPass789',
          role: 'master',
          isActive: true
        },
        {
          phone: '+7 (495) 456-78-90',
          email: 'ekaterina.volkova@example.com',
          password: 'AdvancedPass321',
          role: 'master',
          isActive: true
        },
        {
          phone: '+7 (495) 567-89-01',
          email: 'beauty.salon@example.com',
          password: 'BusinessPass555',
          role: 'salon',
          isActive: true
        },
        {
          phone: '+7 (495) 678-90-12',
          email: 'style.house@example.com',
          password: 'EnterprisePass777',
          role: 'salon',
          isActive: true
        }
      ],
      clients: [
        {
          first_name: 'Иван',
          last_name: 'Петров',
          image_url: 'https://example.com/images/ivan_petrov.jpg'
        },
        {
          first_name: 'Мария',
          last_name: 'Сидорова',
          image_url: 'https://example.com/images/maria_sidorova.jpg'
        }
      ],
      masters: [
        {
          first_name: 'Алексей',
          last_name: 'Иванов',
          specialization: 'Парикмахер-стилист',
          experience: 5,
          bio: 'Опытный парикмахер-стилист с высоким уровнем профессиональной квалификации.',
          image_url: 'https://example.com/images/aleksey_ivanov.jpg',
          is_available: true
        },
        {
          first_name: 'Екатерина',
          last_name: 'Волкова',
          specialization: 'Мастер маникюра',
          experience: 3,
          bio: 'Профессиональный мастер маникюра с внимательным подходом к деталям.',
          image_url: 'https://example.com/images/ekaterina_volkova.jpg',
          is_available: true
        }
      ],
      salons: [
        {
          name: 'Beauty Salon',
          description: 'Современный салон красоты с широким спектром услуг.',
          address: 'г. Москва, ул. Тверская, д. 1',
          inn: '1234567890',
          image_url: 'https://example.com/images/beauty_salon.jpg'
        },
        {
          name: 'Style House',
          description: 'Элитный салон красоты с индивидуальным подходом к каждому клиенту.',
          address: 'г. Москва, ул. Арбат, д. 10',
          inn: '0987654321',
          image_url: 'https://example.com/images/style_house.jpg'
        }
      ]
    };

    // Создаем пользователей и сохраняем их ID
    const createdUsers = [];
    for (const userData of testData.users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`Создан пользователь: ${user.email} (роль: ${user.role})`);
    }

    // Создаем клиентов, мастеров и салоны с правильными связями
    // Сначала клиенты
    for (let i = 0; i < testData.clients.length; i++) {
      const clientData = { ...testData.clients[i] };
      // Связываем с соответствующим пользователем (первые 2 пользователя - клиенты)
      clientData.user_id = createdUsers[i].id;

      const client = await Client.create(clientData);
      console.log(`Создан клиент: ${client.first_name} ${client.last_name}`);
    }

    // Затем салоны (последние 2 пользователя - салоны, начиная с индекса 4)
    for (let i = 0; i < testData.salons.length; i++) {
      const salonData = { ...testData.salons[i] };
      // Связываем с соответствующим пользователем (последние 2 пользователя - салоны)
      salonData.user_id = createdUsers[4 + i].id;

      const salon = await Salon.create(salonData);
      console.log(`Создан салон: ${salon.name}`);
    }

    // Затем мастера (пользователи с индексами 2 и 3 - мастера)
    for (let i = 0; i < testData.masters.length; i++) {
      const masterData = { ...testData.masters[i] };
      // Связываем с соответствующим пользователем (пользователи с индексами 2 и 3 - мастера)
      masterData.user_id = createdUsers[2 + i].id;

      // Получаем салоны для связи с мастером
      const salons = await Salon.findAll();
      if (salons && salons.length > i) {bcrypt
        masterData.salon_id = salons[i].id;
      }

      const master = await Master.create(masterData);
      console.log(`Создан мастер: ${master.first_name} ${master.last_name}`);
    }

    console.log('\nТестовые данные успешно добавлены!');
    console.log('\nТестовые учетные записи:');
    console.log('Клиенты:');
    console.log('- Email: ivan.petrov@example.com, Пароль: StrongPass123');
    console.log('- Email: maria.sidorova@example.com, Пароль: SecurePass456');
    console.log('Мастера:');
    console.log('- Email: aleksey.ivanov@example.com, Пароль: ComplexPass789');
    console.log('- Email: ekaterina.volkova@example.com, Пароль: AdvancedPass321');
    console.log('Салоны:');
    console.log('- Email: beauty.salon@example.com, Пароль: BusinessPass555');
    console.log('- Email: style.house@example.com, Пароль: EnterprisePass777');
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
  } finally {
    await sequelize.close();
  }
}

seedTestData();