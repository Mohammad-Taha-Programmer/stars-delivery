const { sendInternalServerError } = require('../security/errorResponse');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingProvider = require('../models/PendingProvider');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { generatePublicId } = require('../utils/publicId');
const { isMobileRole } = require('../middleware/mobileRole');
const { loadSecurityConfig } = require('../config');
const { isReservedGuestEmail } = require('../services/contactRequest');
const {
  isActiveMobileAccount,
  publicMobileUser,
} = require('../services/mobileSession');
const {
  MIN_MOBILE_PASSWORD_LENGTH,
  MAX_MOBILE_PASSWORD_LENGTH,
  isValidMobilePassword,
} = require('../security/passwordPolicy');
const {
  createMobileLoginLimiter,
  createMobileRegistrationLimiter,
} = require('../security/mobileAuthRateLimit');

const JWT_SECRET = loadSecurityConfig().jwtSecret;

const invalidCredentialsMessage = 'Invalid credentials';
const mobileLoginLimiter = createMobileLoginLimiter();
const mobileRegistrationLimiter =
  createMobileRegistrationLimiter();

const router = express.Router();

router.post('/register', mobileRegistrationLimiter, async (req, res) => {
  try {
    const { fullName, email, phone, password, role, area, privacyPolicy } = req.body;
    if (!isMobileRole(role)) {
      return res.status(400).json({ error: 'Invalid registration role' });
    }

    if (isReservedGuestEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isValidMobilePassword(password)) {
      return res.status(400).json({
        error:
          `Password must be between ${MIN_MOBILE_PASSWORD_LENGTH} and ${MAX_MOBILE_PASSWORD_LENGTH} characters and must not be an obvious placeholder`,
        code: 'PASSWORD_POLICY',
      });
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
    sendInternalServerError(res);
  }
});

router.post('/login', mobileLoginLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!isMobileRole(role)) {
      return res.status(400).json({ error: 'Invalid login role' });
    }

    if (isReservedGuestEmail(email)) {
      return res.status(400).json({
        error: invalidCredentialsMessage,
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({
        error: invalidCredentialsMessage,
      });
    }

    const match =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!match || user.role !== role) {
      return res.status(400).json({
        error: invalidCredentialsMessage,
      });
    }


    if (!isActiveMobileAccount(user, role)) {
      return res.status(403).json({
        error: user.deleted
          ? 'تم حذف هذا الحساب. يرجى إنشاء حساب جديد.'
          : 'هذا الحساب غير نشط حالياً.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const primaryPhone = (user.phoneNumbers || []).find(p => p.primary)?.number || (user.phoneNumbers?.[0]?.number) || '';

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: primaryPhone, role: user.role, area: user.area, publicId: user.publicId || '' },
    });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.get(
  '/me',
  auth,
  requireRole('customer', 'provider'),
  (req, res) => {
    return res.json({
      user: publicMobileUser(
        req.authUser,
      ),
    });
  },
);

module.exports = router;