const express = require('express');
const router = express.Router();
const Gig = require('../models/Gig');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper: Escape regex special chars to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, budget, urgent, rewardType, eta, location } = req.body;

    // Input validation
    if (!title || !description || !category || budget === undefined) {
      return res.status(400).json({ error: 'Title, description, category, and budget are required.' });
    }
    if (budget < 0 || budget > 100000) {
      return res.status(400).json({ error: 'Budget must be between 0 and 100000.' });
    }

    const gig = await Gig.create({
      title, description, category, budget,
      postedBy: req.user._id,
      urgent, rewardType, eta, location
    });
    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET open gigs with pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    let query = { status: 'open' };

    if (category && category !== 'All') query.category = category;
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const gigs = await Gig.find(query)
      .populate('postedBy', 'name email rating initials')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: all gigs
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Admin only' });
    const gigs = await Gig.find()
      .populate('postedBy', 'name email rating initials')
      .sort({ createdAt: -1 })
      .lean();
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile Route: user's gigs
router.get('/user/:id', auth, async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.email !== 'admin@nitandhra.ac.in') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const gigs = await Gig.find({ $or: [{ postedBy: req.params.id }, { acceptedBy: req.params.id }] })
      .populate('postedBy', 'name email rating initials')
      .populate('acceptedBy', 'name email rating initials')
      .sort({ createdAt: -1 })
      .lean();
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a gig
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.status !== 'open') return res.status(400).json({ message: 'Gig is no longer available' });
    if (gig.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot accept your own gig' });
    }

    gig.status = 'in_progress';
    gig.acceptedBy = req.user._id;
    await gig.save();

    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a gig
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { tip = 0, rating = 5, comment = '' } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    if (gig.postedBy.toString() !== req.user._id.toString() && req.user.email !== 'admin@nitandhra.ac.in') {
      return res.status(403).json({ message: 'Only the poster can complete this gig' });
    }
    if (gig.status === 'completed') {
      return res.status(400).json({ message: 'Gig is already completed' });
    }

    gig.status = 'completed';
    gig.tip = Math.max(0, Number(tip));
    gig.platformFee = +(gig.budget * 0.05).toFixed(2);

    if (comment) {
      gig.posterReview = { rating: Math.min(5, Math.max(1, Number(rating))), comment: comment.slice(0, 500) };
    }
    await gig.save();

    // Reward loyalty points
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

// Admin: Clear an absurd review
router.patch('/:id/clear-review', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Admins only' });
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    gig.posterReview = undefined;
    await gig.save();
    const populated = await gig.populate('postedBy', 'name email rating initials');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete Gig
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Admins only' });
    const gig = await Gig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json({ message: 'Gig permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
