import multer from 'multer';

// Store file temporarily in memory buffer for fast backend text extraction
const storage = multer.memoryStorage();

// FIX: PDF only, since DOC/DOCX can't be parsed by this setup
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});