import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { screenResumeWithAI } from '../services/aiService.js';
import pdfParse from 'pdf-extraction';

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
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text || '';
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

      console.log('✅ Resume processed. Text length:', resumeText.length, 'Score:', matchScore);
    } catch (err) {
      console.error('❌ Error during resume processing:', err.message);
      matchScore = 0;
      aiSummary = 'Resume could not be processed automatically. Review the original PDF.';
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

    // FIX: don't send the big base64 PDF back in the response
    const savedApplication = application.toObject();
    delete savedApplication.resumeUrl;

    res.status(201).json(savedApplication);
  } catch (error) {
    console.error('Error in applyJob:', error);
    res.status(500).json({ message: error.message || 'Server error during application submission' });
  }
};

export const getJobSeekerApplications = async (req, res) => {
  try {
    const applicantId = req.user?._id || req.user?.id;
    const apps = await Application.find({ applicant: applicantId })
      .select('-resumeUrl -resumeText') // FIX: skip the heavy fields
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
      .select('-resumeUrl') // FIX: skip the base64 PDF (resumeText stays for the "View Extracted Text" button)
      .populate('job', 'title company location salary type description')
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error('Error in getEmployerApplications:', error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: download one resume on demand
export const downloadResume = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const application = await Application.findById(req.params.id);

    if (!application || !application.resumeUrl) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Only the employer who received it or the applicant who sent it can download
    const isEmployer = application.employer.toString() === userId.toString();
    const isApplicant = application.applicant.toString() === userId.toString();
    if (!isEmployer && !isApplicant) {
      return res.status(403).json({ message: 'Not allowed to download this resume' });
    }

    const base64Data = application.resumeUrl.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error in downloadResume:', error);
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
    ).select('-resumeUrl');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(app);
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({ message: error.message });
  }
};