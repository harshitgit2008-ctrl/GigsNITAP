const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');

router.post('/', async (req, res) => {
  try {
    const { title, description, category, budget, postedBy, urgent, rewardType, eta, location } = req.body;
    const gig = await Gig.create({ title, description, category, budget, postedBy, urgent, rewardType, eta, location });
    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'open' };

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const gigs = await Gig.find(query).populate('postedBy', 'name email rating initials').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a gig
router.patch('/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.status !== 'open') return res.status(400).json({ message: 'Gig is no longer available' });

    gig.status = 'in_progress';
    gig.acceptedBy = userId;
    await gig.save();

    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
