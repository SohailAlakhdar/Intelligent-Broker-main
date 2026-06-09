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
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "application/pdf"  // ✅ allow contract PDFs
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.file_error = "Only .png, .jpg, .jpeg and .pdf formats allowed!";
      return cb(null, false);
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
