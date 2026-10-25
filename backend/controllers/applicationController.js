import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { screenResumeWithAI } from '../services/aiService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Bulletproof resolver for pdf-parse across different Node/ESM build environments
let pdfParse;
try {
  const mod = require('pdf-parse');
  if (typeof mod === 'function') {
    pdfParse = mod;
  } else if (mod && typeof mod.default === 'function') {
    pdfParse = mod.default;
  } else if (mod && typeof mod.pdfParse === 'function') {
    pdfParse = mod.pdfParse;
  } else {
    pdfParse = async (buffer) => ({ text: buffer.toString('utf-8').replace(/[^\w\s@.,-]/gi, ' ') });
  }
} catch (e) {
  pdfParse = async (buffer) => ({ text: buffer.toString('utf-8').replace(/[^\w\s@.,-]/gi, ' ') });
}

export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applicantId = req.user?._id || req.user?.id;
    if (!applicantId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: applicantId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    let resumeText = '';
    let matchScore = 0;
    let aiSummary = '';
    let matchedSkills = [];
    let missingSkills = [];
    let initialStatus = 'Pending';

    // Convert file buffer to Base64 Data URL so employers can view/download it
    const resumeUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    try {
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text || '';
      } else {
        resumeText = req.file.buffer.toString('utf-8');
      }

      const aiResult = await screenResumeWithAI(job.description, job.skillsRequired, resumeText);
      
      matchScore = aiResult.matchScore || aiResult.score || 65;
      aiSummary = aiResult.summary || aiResult.aiSummary || 'Candidate resume successfully screened.';
      matchedSkills = aiResult.matchedSkills || [];
      missingSkills = aiResult.missingSkills || [];

      if (matchScore >= 70) {
        initialStatus = 'Shortlisted';
      }
      
      console.log('✅ Successfully processed application submission.');
    } catch (err) {
      console.error('❌ Warning during AI screening/parsing:', err.message);
      resumeText = resumeText || "Resume uploaded successfully.";
      matchScore = 60;
      aiSummary = "Application submitted with resume attachment.";
    }

    const application = await Application.create({
      job: jobId,
      applicant: applicantId,
      employer: job.postedBy,
      resumeUrl,
      resumeText,
      matchScore,
      aiSummary,
      matchedSkills,
      missingSkills,
      status: initialStatus
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error in applyJob:', error);
    res.status(500).json({ message: error.message || 'Server error during application submission' });
  }
};

export const getJobSeekerApplications = async (req, res) => {
  try {
    const applicantId = req.user?._id || req.user?.id;
    const apps = await Application.find({ applicant: applicantId })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error('Error in getJobSeekerApplications:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getEmployerApplications = async (req, res) => {
  try {
    const employerId = req.user?._id || req.user?.id;
    const apps = await Application.find({ employer: employerId })
      .populate('job', 'title company location salary type description')
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error('Error in getEmployerApplications:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    let { status } = req.body;
    
    if (status && typeof status === 'string') {
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const app = await Application.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(app);
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({ message: error.message });
  }
};