const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  rewardType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
  eta: { type: String, default: '' },
  location: { type: String, default: 'On Campus' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  urgent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Gig', gigSchema);
