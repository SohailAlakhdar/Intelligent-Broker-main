const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: file.fieldname === 'contract'
      ? 'IntelligentBrokerContracts'
      : 'IntelligentBrokerImages',
    resource_type: file.fieldname === 'contract' ? 'raw' : 'image'  // ← required for PDF
  })
});

exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (file.fieldname === 'contract') {
      if (file.mimetype === 'application/pdf' || allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        req.file_error = { message: "Contract must be a PDF" };
        cb(null, false);
      }
    } else if (file.fieldname === 'pic') {
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        req.file_error = { message: "Pictures must be PNG, JPEG, or WEBP" };
        cb(null, false);
      }
    } else {
      req.file_error = { message: "Unexpected field" };
      cb(null, false);
    }
  }
});


/*
multer.diskStorage({
  destination:  './uploads/',
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, file.fieldname + '-' + Date.now()+'.'+ext)
  }
});
*/
