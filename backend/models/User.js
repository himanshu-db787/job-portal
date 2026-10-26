import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'employer', 'admin'], default: 'jobseeker' }, // NEW: admin
  profile: {
    title: { type: String, default: '' },
    skills: [String],
    resumeUrl: { type: String, default: '' },
    bio: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);