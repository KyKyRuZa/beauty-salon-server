const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const uploadLogger = createLogger('upload-middleware');

// Создаем директорию uploads если не существует
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  uploadLogger.info(`📁 Создана директория для загрузок: ${uploadDir}`);
}

// Локальное хранилище файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Фильтр файлов - только изображения
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    uploadLogger.warn('Попытка загрузки неизображаемого файла', {
      mimetype: file.mimetype,
      originalName: file.originalname,
      userId: req.user?.id,
    });
    cb(new Error('Можно загружать только изображения'), false);
  }
};

// Конфигурация multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
  fileFilter: fileFilter,
});

module.exports = upload;
