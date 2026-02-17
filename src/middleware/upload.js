const multer = require('multer');
const path = require('path');
const { createLogger } = require('../utils/logger');

const uploadLogger = createLogger('upload-middleware');

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Указываем папку для временного хранения загруженных файлов
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Создаем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Фильтрация файлов по типу
const fileFilter = (req, file, cb) => {
  // Разрешаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    uploadLogger.warn('Попытка загрузки неизображаемого файла', {
      mimetype: file.mimetype,
      originalName: file.originalname,
      userId: req.user?.id
    });
    
    cb(new Error('Можно загружать только изображения'), false);
  }
};

// Создаем экземпляр multer с настройками
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Ограничение размера файла до 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;