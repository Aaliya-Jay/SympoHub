import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const DEPARTMENTS = ['AI & DS', 'CSE', 'ECE', 'IT', 'Mech'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    maxlength: 254
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
  department: { type: String, enum: DEPARTMENTS, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  strict: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export { DEPARTMENTS };
export default User;
