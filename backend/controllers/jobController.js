import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { checkJobForSpam, SPAM_THRESHOLD } from '../services/spamService.js';

// Public list: hide Pending and Rejected jobs.
// $nin also matches old jobs that have no status field, so no migration is needed.
const PUBLIC_FILTER = { status: { $nin: ['Pending', 'Rejected'] } };

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find(PUBLIC_FILTER).populate('postedBy', 'name email').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: an employer's own jobs, including Pending and Rejected ones
export const getMyJobs = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    if (req.user?.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied: Employers only' });
    }

    const { title, description, company, location, salary, type, skillsRequired } = req.body;

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User authorization missing' });
    }

    // NEW: spam check decides if the job goes live or waits for an admin
    const spam = await checkJobForSpam({ title, company, description });
    const status = spam.spamScore >= SPAM_THRESHOLD ? 'Pending' : 'Approved';

    console.log(`🛡️ Spam check: score ${spam.spamScore} -> ${status} (${spam.reason})`);

    const job = await Job.create({
      title,
      description,
      company,
      location: location || 'Remote',
      salary: salary || 'Negotiable',
      type: type || 'Full-Time',
      skillsRequired: skillsRequired || [],
      postedBy: userId,
      status,
      spamScore: spam.spamScore,
      spamReason: spam.reason
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
};

// NEW: admin only - jobs waiting for review
export const getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Pending' })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: admin only - approve or reject a job
export const reviewJob = async (req, res) => {
  try {
    const { decision } = req.body;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Rejected' });
    }

    const job = await Job.findByIdAndUpdate(req.params.id, { status: decision }, { new: true });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.user?._id || req.user?.id;

    // Only the employer who posted the job (or an admin) can delete it
    const isOwner = job.postedBy.toString() === userId.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed to delete this job' });
    }

    await Application.deleteMany({ job: req.params.id });
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};