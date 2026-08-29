const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['seller', 'buyer', 'both'], default: 'both' },
  skills: [{ type: String }],
  bio: { type: String, default: 'Active Campus Student' },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  university: { type: String, default: '' },
  major: { type: String, default: '' },
  year: { type: String, default: '' },
  initials: { type: String, default: '' },
  loyaltyPoints: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);