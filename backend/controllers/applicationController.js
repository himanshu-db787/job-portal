import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { screenResumeWithAI } from '../services/aiService.js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload memory buffer to Cloudinary via native Node stream
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'job-portal-resumes', resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(fileBuffer).pipe(stream);
  });
};

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

    let resumeUrl = '';
    let resumeText = '';
    let matchScore = 0;
    let aiSummary = '';
    let matchedSkills = [];
    let missingSkills = [];
    let initialStatus = 'Pending';

    try {
      // 1. Upload buffer to Cloudinary to get a real HTTP secure URL for the frontend
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      resumeUrl = cloudinaryResult.secure_url;

      // 2. Parse PDF text for AI screening
      if (req.file.mimetype === 'application/pdf' && typeof pdfParse === 'function') {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text || '';
      } else {
        resumeText = req.file.buffer.toString('utf-8');
      }

      const aiResult = await screenResumeWithAI(job.description, job.skillsRequired, resumeText);
      
      matchScore = aiResult.matchScore || aiResult.score || 0;
      aiSummary = aiResult.summary || aiResult.aiSummary || '';
      matchedSkills = aiResult.matchedSkills || [];
      missingSkills = aiResult.missingSkills || [];

      if (matchScore >= 70) {
        initialStatus = 'Shortlisted';
      }
      
      console.log('✅ Successfully processed Cloudinary upload and AI screening.');
    } catch (err) {
      console.error('❌ Error in resume processing:', err.message);
      return res.status(500).json({ message: 'Failed to process application: ' + err.message });
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