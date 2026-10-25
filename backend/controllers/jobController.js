import Job from '../models/Job.js';

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email').sort({ createdAt: -1 });
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

    const job = await Job.create({
      title,
      description,
      company,
      location: location || 'Remote',
      salary: salary || 'Negotiable',
      type: type || 'Full-Time',
      skillsRequired: skillsRequired || [],
      postedBy: userId
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};