const multer = require('multer');
const path = require('path');
const { createLogger } = require('../utils/logger');

const uploadLogger = createLogger('upload-middleware');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const fileFilter = (req, file, cb) => {

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


const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = upload;