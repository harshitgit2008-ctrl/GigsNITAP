const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register or Login (upsert by email)
router.post('/register', async (req, res) => {
  try {
    const { name, email, skills, bio, role, university, major, year, initials } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      // Update fields if provided on re-login
      if (name) user.name = name;
      if (role) user.role = role;
      if (skills && skills.length) user.skills = skills;
      if (bio) user.bio = bio;
      if (university) user.university = university;
      if (major) user.major = major;
      if (year) user.year = year;
      if (initials) user.initials = initials;
      await user.save();
      return res.status(200).json(user);
    }
    user = await User.create({ name, email, skills, bio, role, university, major, year, initials });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/availability', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ message: 'Availability updated', isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
