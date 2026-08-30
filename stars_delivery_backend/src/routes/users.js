const { sendInternalServerError } = require('../security/errorResponse');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  MIN_MOBILE_PASSWORD_LENGTH,
  MAX_MOBILE_PASSWORD_LENGTH,
  isValidMobilePassword,
} = require('../security/passwordPolicy');

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

// Self-service password change.
// This requires both an authenticated mobile session and
// knowledge of the account's current credential.
router.put('/password', async (req, res) => {
  try {
    const currentPassword =
      typeof req.body.currentPassword === 'string'
        ? req.body.currentPassword
        : '';

    const newPassword =
      typeof req.body.newPassword === 'string'
        ? req.body.newPassword
        : '';

    const confirmPassword =
      typeof req.body.confirmPassword === 'string'
        ? req.body.confirmPassword
        : '';

    if (
      !currentPassword
      || !newPassword
      || !confirmPassword
    ) {
      return res.status(400).json({
        error:
          'Current password, new password, and confirmation are required',
        code: 'PASSWORD_FIELDS_REQUIRED',
      });
    }

    const user =
      await User.findById(
        req.userId,
      ).select('+password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const currentMatches =
      await bcrypt.compare(
        currentPassword,
        user.password,
      );

    if (!currentMatches) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'CURRENT_PASSWORD_INVALID',
      });
    }

    if (!isValidMobilePassword(newPassword)) {
      return res.status(400).json({
        error:
          `New password must be between ${MIN_MOBILE_PASSWORD_LENGTH} and ${MAX_MOBILE_PASSWORD_LENGTH} characters and must not be an obvious placeholder`,
        code: 'PASSWORD_POLICY',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error:
          'New password and confirmation do not match',
        code: 'PASSWORD_CONFIRMATION_MISMATCH',
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10,
      );

    await user.save();

    return res.json({
      message: 'Password updated',
    });
  } catch (err) {
    return sendInternalServerError(res);
  }
});

// Profile update intentionally excludes credential changes.
router.put('/profile', async (req, res) => {
  try {
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        'password',
      )
    ) {
      return res.status(400).json({
        error:
          'Use the dedicated password endpoint to change credentials',
        code: 'PASSWORD_ENDPOINT_REQUIRED',
      });
    }

    const {
      fullName,
      email,
    } = req.body;

    const update = {};

    if (fullName) {
      update.fullName = fullName;
    }

    if (email) {
      update.email = email.toLowerCase();
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
      });
    }

    const user =
      await User.findByIdAndUpdate(
        req.userId,
        update,
        {
          new: true,
        },
      );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json({
      message: 'Profile updated',
    });
  } catch (err) {
    return sendInternalServerError(res);
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
