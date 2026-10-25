import express from 'express';
import { 
  applyJob, 
  getJobSeekerApplications, 
  getEmployerApplications, 
  downloadResume,
  updateApplicationStatus 
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Wrap multer to capture upload errors directly
const handleUpload = (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
};

router.post('/', protect, handleUpload, applyJob);
router.get('/jobseeker', protect, getJobSeekerApplications);
router.get('/employer', protect, getEmployerApplications);
router.get('/:id/resume', protect, downloadResume); // NEW
router.patch('/:id/status', protect, updateApplicationStatus);

export default router;