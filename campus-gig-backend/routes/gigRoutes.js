const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');

router.post('/', async (req, res) => {
  try {
    const { title, description, category, budget, postedBy, urgent } = req.body;
    const gig = await Gig.create({ title, description, category, budget, postedBy, urgent });
    res.status(201).json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'open' };

    if (category && category !== 'All') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const gigs = await Gig.find(query).populate('postedBy', 'name rating email').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const gig = await Gig.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
