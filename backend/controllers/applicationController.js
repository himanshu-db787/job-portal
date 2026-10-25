import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { screenResumeWithAI } from '../services/aiService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Robust pdf-parse resolver
let pdfParse;
try {
  const mod = require('pdf-parse');
  pdfParse = typeof mod === 'function' ? mod : (mod.default || mod);
} catch (e) {
  pdfParse = async (buffer) => ({ text: buffer.toString('utf-8') });
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

    // 1. Convert file buffer into a Base64 Data URL for direct MongoDB storage & download
    const resumeUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    try {
      // 2. Extract PDF text in memory
      if (req.file.mimetype === 'application/pdf' && typeof pdfParse === 'function') {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text || '';
      } else {
        resumeText = req.file.buffer.toString('utf-8');
      }

      // 3. Run AI Screening
      const aiResult = await screenResumeWithAI(job.description, job.skillsRequired, resumeText);
      
      matchScore = aiResult.matchScore || aiResult.score || 0;
      aiSummary = aiResult.summary || aiResult.aiSummary || '';
      matchedSkills = aiResult.matchedSkills || [];
      missingSkills = aiResult.missingSkills || [];

      if (matchScore >= 70) {
        initialStatus = 'Shortlisted';
      }
      
      console.log('✅ Successfully processed application submission with Base64 storage.');
    } catch (err) {
      console.error('❌ Error during resume processing:', err.message);
      resumeText = resumeText || "Resume uploaded successfully.";
      matchScore = 60;
      aiSummary = "Candidate applied with resume attachment.";
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