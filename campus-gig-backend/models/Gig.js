const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  urgent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Gig', gigSchema);


const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');

router.post('/', async (req, res) => {
  try {
    const gig = await Gig.create(req.body);
    res.status(201).json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const gigs = await Gig.find().populate('postedBy', 'name rating').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a gig route
router.patch('/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body;
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { status: 'in_progress', acceptedBy: userId },
      { new: true }
    );
    res.json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

