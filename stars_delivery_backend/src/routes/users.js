const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.put('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude, area } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const update = {
      lastLatitude: latitude,
      lastLongitude: longitude,
      lastLocationUpdate: new Date(),
    };
    if (area) update.area = area;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Location updated', area: user.area });
  } catch (err) {
    console.error('Update location error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to update location' });
  }
});

router.get('/location', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'area lastLatitude lastLongitude lastLocationUpdate');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile update (name, email, password)
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const update = {};
    if (fullName) update.fullName = fullName;
    if (email) update.email = email.toLowerCase();
    if (password) update.password = await bcrypt.hash(password, 10);

    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Frequent items
router.get('/frequent-items', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'frequentItems');
    res.json({ items: user?.frequentItems || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/frequent-items', auth, async (req, res) => {
  try {
    const { item } = req.body;
    if (!item) return res.status(400).json({ error: 'Item required' });
    const user = await User.findById(req.userId);
    if (!user.frequentItems.includes(item)) {
      user.frequentItems.push(item);
      await user.save();
    }
    res.json({ items: user.frequentItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/frequent-items', auth, async (req, res) => {
  try {
    const { item } = req.body;
    const user = await User.findById(req.userId);
    user.frequentItems = user.frequentItems.filter(i => i !== item);
    await user.save();
    res.json({ items: user.frequentItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phone numbers management
router.get('/phones', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'phoneNumbers');
    res.json({ phones: user.phoneNumbers || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/phones', auth, async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone required' });
    const user = await User.findById(req.userId);
    if (!user.phoneNumbers.some(p => p.number === number)) {
      user.phoneNumbers.push({ number, primary: false });
      await user.save();
    }
    res.json({ phones: user.phoneNumbers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/phones', auth, async (req, res) => {
  try {
    const { number } = req.body;
    const user = await User.findById(req.userId);
    const phone = user.phoneNumbers.find(p => p.number === number);
    if (phone?.primary) return res.status(400).json({ error: 'Cannot remove primary phone. Set another as primary first.' });
    user.phoneNumbers = user.phoneNumbers.filter(p => p.number !== number);
    await user.save();
    res.json({ phones: user.phoneNumbers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/phones/primary', auth, async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone required' });
    const user = await User.findById(req.userId);
    for (let i = 0; i < user.phoneNumbers.length; i++) {
      user.phoneNumbers[i].primary = user.phoneNumbers[i].number === number;
    }
    user.markModified('phoneNumbers');
    await user.save();
    res.json({ phones: user.phoneNumbers });
    res.json({ phones: user.phoneNumbers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
