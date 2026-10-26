import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  salary: { type: String, default: 'Negotiable' },
  type: { type: String, default: 'Full-Time' },
  skillsRequired: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // NEW: moderation fields
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  spamScore: { type: Number, default: 0 },
  spamReason: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);