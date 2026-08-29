const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gig = require('../models/Gig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

// Security: Aggressive rate limit on auth endpoint to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, skills, bio, role, university, major, year, initials } = req.body;

    // Input validation
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Login flow
      const validPassword = await bcrypt.compare(password, user.password || '');
      // Fallback for old plaintext passwords
      if (!validPassword && password !== user.password) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Update fields if provided
      if (name) user.name = name;
      if (role) user.role = role;
      if (skills && skills.length) user.skills = skills;
      if (bio) user.bio = bio;
      if (university) user.university = university;
      if (major) user.major = major;
      if (year) user.year = year;
      if (initials) user.initials = initials;

      // Auto-upgrade plaintext to hashed
      if (!validPassword) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();
      const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ user, token });
    }

    // Registration flow
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({ name, email: email.toLowerCase().trim(), password: hashedPassword, skills, bio, role, university, major, year, initials });

    const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.email !== 'admin@nitandhra.ac.in') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Security: Prevent privilege escalation — disallow updating role or email via PATCH
    const { role, email, password, loyaltyPoints, ...safeFields } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, safeFields, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/availability', auth, async (req, res) => {
  try {
    if (req.user._id !== req.params.id) return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ message: 'Availability updated', isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Route: Delete User & Cascade
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Admins only' });

    // Integrity: Cascade delete all gigs posted by or accepted by this user
    await Gig.deleteMany({ postedBy: req.params.id });
    await Gig.updateMany({ acceptedBy: req.params.id }, { $set: { acceptedBy: null, status: 'open' } });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User and all associated data permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
