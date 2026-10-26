import express from 'express';
import {
  getJobs,
  getMyJobs,
  createJob,
  getPendingJobs,
  reviewJob,
  deleteJob
} from '../controllers/jobController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/mine', protect, getMyJobs);                          // NEW
router.get('/pending', protect, adminOnly, getPendingJobs);       // NEW
router.post('/', protect, createJob);
router.patch('/:id/review', protect, adminOnly, reviewJob);       // NEW
router.delete('/:id', protect, deleteJob);

export default router;