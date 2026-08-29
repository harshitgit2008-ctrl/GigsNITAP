const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true },
  budget: { type: Number, required: true, min: 0, max: 100000 },
  rewardType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
  eta: { type: String, default: '', trim: true },
  location: { type: String, default: 'On Campus', trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  urgent: { type: Boolean, default: false },
  platformFee: { type: Number, default: 0, min: 0 },
  tip: { type: Number, default: 0, min: 0 },
  posterReview: { rating: Number, comment: String },
  workerReview: { rating: Number, comment: String },
}, { timestamps: true });

// Scalability: Compound indexes for the most common query patterns
gigSchema.index({ status: 1, category: 1, createdAt: -1 });
gigSchema.index({ postedBy: 1 });
gigSchema.index({ acceptedBy: 1 });

module.exports = mongoose.model('Gig', gigSchema);
