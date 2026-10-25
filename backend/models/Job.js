import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  salary: { type: String, default: 'Negotiable' }, // Changed to String to allow values like "$1000"
  type: { type: String, default: 'Full-Time' },    // Matched with frontend 'type' key
  skillsRequired: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);