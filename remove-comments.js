const fs = require('fs');
const path = require('path');

// Список файлов для обработки
const filesToProcess = [
  'src/middleware/security.js',
  'src/app.js',
  'src/modules/user/controllers/authController.js',
  'src/modules/user/services/authService.js',
  'src/modules/user/routes/authRoutes.js',
  'src/middleware/auth.js',
  'src/utils/sessionService.js',
  'src/modules/catalog/services/catalogService.js',
  'src/utils/cacheService.js',
  'src/config/redis.js',
  'src/modules/catalog/routes/catalogRoutes.js',
  'src/modules/catalog/controllers/catalogController.js',
  'src/modules/booking/controllers/availabilityController.js',
  'src/modules/booking/services/availabilityService.js',
  'src/modules/user/models/MasterSkill.js',
  'src/modules/user/models/MasterPortfolio.js',
  'src/config/database.js',
  'src/config/associations.js',
  'src/modules/user/models/Master.js',
  'src/modules/booking/services/bookingService.js',
  'src/modules/booking/controllers/timeslotController.js',
  'src/validation/booking.js',
  'src/modules/booking/models/Booking.js',
  'src/middleware/upload.js',
  'src/middleware/validation.js',
  'src/modules/admin/controllers/adminAuthController.js',
  'src/modules/admin/controllers/adminController.js',
  'src/modules/admin/index.js',
  'src/modules/admin/models/Admin.js',
  'src/modules/admin/routes/adminAuthRoutes.js',
  'src/modules/admin/routes/adminRoutes.js',
  'src/modules/admin/services/adminAuthService.js',
  'src/modules/admin/services/adminService.js',
  'src/modules/booking/controllers/bookingController.js',
  'src/modules/booking/models/MasterAvailability.js',
  'src/modules/booking/models/TimeSlot.js',
  'src/modules/booking/routes/availabilityRoutes.js',
  'src/modules/booking/routes/bookingRoutes.js',
  'src/modules/booking/routes/timeslotRoutes.js',
  'src/modules/catalog/index.js',
  'src/modules/catalog/models/MasterService.js',
  'src/modules/catalog/models/ServiceCategory.js',
  'src/modules/catalog/models/ServiceSubcategory.js',
  'src/modules/chat/controllers/authController.js',
  'src/modules/chat/models/Message.js',
  'src/modules/chat/models/User.js',
  'src/modules/chat/routes/authRoutes.js',
  'src/modules/chat/services/authService.js',
  'src/modules/chat/socket/chatHandler.js',
  'src/modules/user/controllers/favoriteController.js',
  'src/modules/user/controllers/providerController.js',
  'src/modules/user/controllers/reviewController.js',
  'src/modules/user/controllers/serviceController.js',
  'src/modules/user/models/Client.js',
  'src/modules/user/models/Favorite.js',
  'src/modules/user/models/Review.js',
  'src/modules/user/models/Salon.js',
  'src/modules/user/models/User.js',
  'src/modules/user/routes/favoriteRoutes.js',
  'src/modules/user/routes/providerRoutes.js',
  'src/modules/user/routes/reviewRoutes.js',
  'src/modules/user/routes/serviceRoutes.js',
  'src/modules/user/services/favoriteService.js',
  'src/modules/user/services/reviewService.js',
  'src/modules/user/services/serviceService.js',
  'src/modules/user/services/userService.js',
  'src/server.js',
  'src/utils/helpers.js',
  'src/utils/logger.js',
  'src/validation/admin.js',
  'src/validation/adminAuth.js',
  'src/validation/auth.js',
  'src/validation/base.js',
  'src/validation/catalog.js',
  'src/validation/index.js',
  'src/validation/user.js',
  'apply-trigram-migration.js',
  'seed_test_data.js'
];

/**
 * Удаляет однострочные (//) и многострочные (/** *) комментарии,
 * но сохраняет http:// и https:// в строках
 */
function removeComments(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let inRegex = false;
  
  while (i < code.length) {
    // Проверка на начало строки
    if (!inString && (code[i] === '"' || code[i] === "'" || code[i] === '`')) {
      inString = true;
      stringChar = code[i];
      result += code[i];
      i++;
      continue;
    }
    
    // Проверка на конец строки
    if (inString && code[i] === stringChar && code[i - 1] !== '\\') {
      inString = false;
      stringChar = '';
      result += code[i];
      i++;
      continue;
    }
    
    // Если мы внутри строки - просто копируем
    if (inString) {
      result += code[i];
      i++;
      continue;
    }
    
    // Проверка на однострочный комментарий //
    if (code[i] === '/' && code[i + 1] === '/') {
      // Проверяем, не является ли это частью URL (http:// или https://)
      // Для этого смотрим назад на несколько символов
      const beforeComment = result.slice(-10);
      if (beforeComment.match(/https?:$/)) {
        // Это часть URL, копируем как есть
        result += code[i];
        i++;
        continue;
      }
      
      // Пропускаем до конца строки
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      // Сохраняем перевод строки
      if (i < code.length) {
        result += '\n';
        i++;
      }
      continue;
    }
    
    // Проверка на многострочный комментарий /**/
    if (code[i] === '/' && code[i + 1] === '*') {
      // Пропускаем до */
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2; // Пропускаем */
      continue;
    }
    
    result += code[i];
    i++;
  }
  
  return result;
}

// Обработка файлов
const baseDir = __dirname;
let processedCount = 0;
let totalCount = filesToProcess.length;

for (const file of filesToProcess) {
  const filePath = path.join(baseDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${file}`);
    continue;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeComments(content);
    
    // Проверяем, были ли изменения
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✓ Обработан: ${file}`);
      processedCount++;
    } else {
      console.log(`  Без изменений: ${file}`);
    }
  } catch (err) {
    console.error(`✗ Ошибка обработки ${file}: ${err.message}`);
  }
}

console.log(`\nГотово! Обработано файлов: ${processedCount}/${totalCount}`);
