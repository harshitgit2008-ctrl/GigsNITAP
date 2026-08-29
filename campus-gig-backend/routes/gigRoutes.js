
const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, budget, urgent, rewardType, eta, location } = req.body;
    // Security: force postedBy to be the authenticated user
    const gig = await Gig.create({ title, description, category, budget, postedBy: req.user._id, urgent, rewardType, eta, location });
    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all active gigs (with Pagination)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let query = { status: 'open' };

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const gigs = await Gig.find(query)
      .populate('postedBy', 'name email rating initials')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Scalability: leaner objects
      
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Admin only' });
    const gigs = await Gig.find().populate('postedBy', 'name email rating initials').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile Route
router.get('/user/:id', auth, async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Unauthorized' });
    const gigs = await Gig.find({ $or: [{ postedBy: req.params.id }, { acceptedBy: req.params.id }] })
      .populate('postedBy', 'name email rating initials')
      .populate('acceptedBy', 'name email rating initials')
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.status !== 'open') return res.status(400).json({ message: 'Gig is no longer available' });
    
    // Prevent accepting own gig
    if (gig.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot accept your own gig' });
    }

    gig.status = 'in_progress';
    gig.acceptedBy = req.user._id; // Use secure auth token ID
    await gig.save();

    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { tip = 0, rating = 5, comment = "" } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    
    // Only the poster can complete it
    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.email !== 'admin@nitandhra.ac.in') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    gig.status = 'completed';
    gig.tip = Number(tip);
    gig.platformFee = (gig.budget * 0.05); // 5% fee
    
    // Add review
    if (comment) {
      gig.posterReview = { rating: Number(rating), comment };
    }
    await gig.save();

    // Reward users (ACID transaction logic ideally, but done sequentially here for hackathon)
    await User.findByIdAndUpdate(gig.postedBy, { $inc: { loyaltyPoints: 10 } });
    if (gig.acceptedBy) {
      await User.findByIdAndUpdate(gig.acceptedBy, { $inc: { loyaltyPoints: 50 } });
    }

    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
