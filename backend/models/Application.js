import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Shortlisted', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  resumeUrl: {
    type: String,
    required: false
  },
  resumeText: {
    type: String,
    default: ''
  },
  matchScore: { type: Number, default: 0 },
  aiSummary: { type: String, default: '' },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);