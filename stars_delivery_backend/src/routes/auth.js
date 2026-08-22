const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingProvider = require('../models/PendingProvider');
const { generatePublicId } = require('../utils/publicId');
const { isMobileRole } = require('../middleware/mobileRole');

const JWT_SECRET = process.env.JWT_SECRET || 'stars_delivery_secret_key_2026';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role, area, privacyPolicy } = req.body;
    if (!isMobileRole(role)) {
      return res.status(400).json({ error: 'Invalid registration role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });
    const existingPending = await PendingProvider.findOne({ email });
    if (existingPending) return res.status(400).json({ error: 'Email already pending review' });

    const hashed = await bcrypt.hash(password, 10);

    // Providers go through admin approval flow
    if (role === 'provider') {
      await PendingProvider.create({ fullName, email, phone, password: hashed, area });
      return res.status(201).json({
        pending: true,
        message: 'تم تقديم طلب التسجيل بنجاح. حسابك قيد المراجعة من قبل الإدارة.',
      });
    }

    // Customers register immediately
    const publicId = await generatePublicId();
    const user = await User.create({
      fullName, email, password: hashed, role, area, publicId,
      phoneNumbers: [{ number: phone, primary: true }],
      privacyPolicy: privacyPolicy || false,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone, role: user.role, area: user.area, publicId: user.publicId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!isMobileRole(role)) {
      return res.status(400).json({ error: 'Invalid login role' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.deleted) return res.status(403).json({ error: 'تم حذف هذا الحساب. يرجى إنشاء حساب جديد.' });

    if (user.role !== role) return res.status(400).json({ error: `No account found for this role` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const primaryPhone = (user.phoneNumbers || []).find(p => p.primary)?.number || (user.phoneNumbers?.[0]?.number) || '';

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: primaryPhone, role: user.role, area: user.area, publicId: user.publicId || '' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;