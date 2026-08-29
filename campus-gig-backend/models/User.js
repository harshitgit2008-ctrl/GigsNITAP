const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['seller', 'buyer', 'both', 'admin'], default: 'both' },
  skills: [{ type: String, trim: true }],
  bio: { type: String, default: 'Active Campus Student', maxlength: 500 },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  university: { type: String, default: '', trim: true },
  major: { type: String, default: '', trim: true },
  year: { type: String, default: '', trim: true },
  initials: { type: String, default: '', trim: true },
  loyaltyPoints: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Scalability: Index on email for fast login lookups
userSchema.index({ email: 1 });

// Security: Never return password in JSON responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
