const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const requireAdminSession = require('../middleware/requireAdminSession');
const { ADMIN_SESSION_COOKIE } = require('../middleware/adminSession');
const { isValidAdminPassword, MIN_ADMIN_PASSWORD_LENGTH } = require('../security/passwordPolicy');

const router = express.Router();

const invalidCredentialsMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => res.status(429).render('login', { error: invalidCredentialsMessage }),
});

router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('login', { error: null });
});

router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const admin = identifier
      ? await User.findOne({ email: identifier, role: 'admin', deleted: { $ne: true }, status: 'active' })
      : null;

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).render('login', { error: invalidCredentialsMessage });
    }

    req.session.regenerate((err) => {
      if (err) return res.status(500).render('login', { error: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
      req.session.admin = {
        id: admin._id.toString(),
        email: admin.email,
        fullName: admin.fullName,
        role: 'admin',
      };
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).render('login', { error: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
        return res.redirect('/admin');
      });
    });
  } catch {
    return res.status(401).render('login', { error: invalidCredentialsMessage });
  }
});

router.post('/reset-password', requireAdminSession, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const admin = await User.findOne({
      _id: req.session.admin.id,
      role: 'admin',
      deleted: { $ne: true },
      status: 'active',
    });
    if (!admin || !(await bcrypt.compare(currentPassword || '', admin.password))) {
      return res.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }
    if (!isValidAdminPassword(newPassword)) {
      return res.json({ success: false, message: `كلمة المرور الجديدة يجب أن تكون ${MIN_ADMIN_PASSWORD_LENGTH} حرفاً على الأقل` });
    }
    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: 'كلمة المرور وتأكيدها غير متطابقين' });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();
    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch {
    return res.status(500).json({ success: false, message: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(ADMIN_SESSION_COOKIE);
    res.redirect('/admin/login');
  });
});

module.exports = router;
