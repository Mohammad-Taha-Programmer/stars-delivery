const { sendInternalServerError } = require('../security/errorResponse');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
router.use(auth, requireRole('customer', 'provider'));

router.put('/location', async (req, res) => {
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
    sendInternalServerError(res);
  }
});

router.get('/location', async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'area lastLatitude lastLongitude lastLocationUpdate');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    sendInternalServerError(res);
  }
});

// Profile update (name, email, password)
router.put('/profile', async (req, res) => {
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
    sendInternalServerError(res);
  }
});

// Frequent items
router.get('/frequent-items', async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'frequentItems');
    res.json({ items: user?.frequentItems || [] });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.post('/frequent-items', async (req, res) => {
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
    sendInternalServerError(res);
  }
});

router.delete('/frequent-items', async (req, res) => {
  try {
    const { item } = req.body;
    const user = await User.findById(req.userId);
    user.frequentItems = user.frequentItems.filter(i => i !== item);
    await user.save();
    res.json({ items: user.frequentItems });
  } catch (err) {
    sendInternalServerError(res);
  }
});

// Phone numbers management
router.get('/phones', async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'phoneNumbers');
    res.json({ phones: user.phoneNumbers || [] });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.post('/phones', async (req, res) => {
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
    sendInternalServerError(res);
  }
});

router.delete('/phones', async (req, res) => {
  try {
    const { number } = req.body;
    const user = await User.findById(req.userId);
    const phone = user.phoneNumbers.find(p => p.number === number);
    if (phone?.primary) return res.status(400).json({ error: 'Cannot remove primary phone. Set another as primary first.' });
    user.phoneNumbers = user.phoneNumbers.filter(p => p.number !== number);
    await user.save();
    res.json({ phones: user.phoneNumbers });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.put('/phones/primary', async (req, res) => {
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
  } catch (err) {
    sendInternalServerError(res);
  }
});

module.exports = router;
