
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hackathon_key';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, skills, bio, role, university, major, year, initials } = req.body;
    let user = await User.findOne({ email });
    
    if (user) {
      // Login flow if user exists
      if (!password) return res.status(400).json({ error: 'Password required' });
      
      const validPassword = await bcrypt.compare(password, user.password || '');
      // Fallback for old plaintext passwords from earlier in the hackathon
      if (!validPassword && password !== user.password) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
      
      // Update fields if provided on re-login
      if (name) user.name = name;
      if (role) user.role = role;
      if (skills && skills.length) user.skills = skills;
      if (bio) user.bio = bio;
      if (university) user.university = university;
      if (major) user.major = major;
      if (year) user.year = year;
      if (initials) user.initials = initials;
      
      // Upgrade plaintext to hashed if needed
      if (!validPassword) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      
      await user.save();
      const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ user, token });
    }
    
    // Registration flow
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = await User.create({ name, email, password: hashedPassword, skills, bio, role, university, major, year, initials });
    
    const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (Protected, Admin only logically but left open for directory)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
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


// Admin Route: Delete User
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.email !== 'admin@nitandhra.ac.in') return res.status(403).json({ error: 'Unauthorized: Admins only' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;

