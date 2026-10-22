import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ['Symposium', 'Workshop', 'Hackathon'], required: true },
  organizerClub: { type: String, required: true, trim: true, maxlength: 160 },
  venue: { type: String, required: true, trim: true, maxlength: 240 },
  date: { type: Date, required: true, index: true },
  capacity: { type: Number, required: true, min: 1, max: 100000 },
  departments: {
    type: [{ type: String, enum: ['AI & DS', 'CSE', 'ECE', 'IT', 'Mech', 'All'] }],
    required: true,
    validate: {
      validator: value => Array.isArray(value) && value.length > 0,
      message: 'Select at least one eligible department.'
    },
    index: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  // Order is meaningful: this array is a FIFO queue. Do not sort it.
  waitlist: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  strict: true
});

eventSchema.index({ date: 1, category: 1 });
eventSchema.index({ departments: 1, date: 1 });
eventSchema.index({ title: 'text', description: 'text', organizerClub: 'text' });

export default mongoose.model('Event', eventSchema);
