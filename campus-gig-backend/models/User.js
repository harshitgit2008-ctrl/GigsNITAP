const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  skills: [{ type: String }],
  bio: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 5.0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
