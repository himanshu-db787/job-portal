import express from 'express';
import { getJobs, createJob, deleteJob } from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', getJobs);
router.post('/', protect, createJob);
router.delete('/:id', protect, deleteJob);

export default router;