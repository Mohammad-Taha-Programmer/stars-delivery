const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const PendingProvider = require('../models/PendingProvider');
const { generatePublicId } = require('../utils/publicId');

const upload = multer();

router.get('/search', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.json({ error: 'الرجاء إدخال رقم السائق أو الاسم' });

    const match = await User.findOne({
      role: 'provider',
      $or: [
        { publicId: id },
        { fullName: { $regex: id, $options: 'i' } },
      ],
    }).lean();

    if (!match) return res.json({ error: 'لم يتم العثور على سائق' });

    const orders = await Order.find({
      providerId: match._id,
      status: { $in: ['accepted', 'fulfilling', 'completed'] },
    }).lean();
    const orderCount = orders.length;
    const netProfit = orders.reduce((s, o) => s + (o.providerEarning || 0), 0);
    const totalCommission = orders.reduce((s, o) => s + (o.platformCommission || 0), 0);

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    const last30Profit = recentOrders.reduce((s, o) => s + (o.providerEarning || 0), 0);

    const driver = {
      _id: match._id.toString(),
      driverId: match.publicId || match._id.toString().slice(-8),
      name: match.fullName || match.name,
      email: match.email,
      phone: match.phone,
      serviceType: 'توصيل',
      licenseType: match.publicId ? 'موثق' : 'غير موثق',
      area: match.area || 'غير محدد',
      status: match.status === 'blocked' ? 'inactive' : match.status,
      password: '****',
      financial: {
        paymentStatus: 'unpaid',
        transactions: orders.map(o => ({
          id: o._id.toString(),
          desc: `طلب #${o._id.toString().slice(-8)}`,
          amount: o.providerEarning || 0,
          date: o.createdAt.toISOString().split('T')[0]
        }))
      }
    };

    res.json({ driver, commission: orderCount, netProfit, last30Profit, totalCommission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { driverName, driverEmail, driverPhone, driverServiceType, driverLicenseType, driverArea } = req.body;
    if (!driverName || !driverEmail || !driverPhone) {
      return res.json({ success: false, message: 'الرجاء ملء جميع الحقول المطلوبة' });
    }

    const exists = await User.findOne({ email: driverEmail.toLowerCase() });
    if (exists) return res.json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });

    const hashedPassword = await bcrypt.hash('Pass1234', 10);
    const publicId = await generatePublicId();
    const user = new User({
      fullName: driverName,
      name: driverName,
      email: driverEmail.toLowerCase(),
      phoneNumbers: [{ number: driverPhone, primary: true }],
      password: hashedPassword,
      role: 'provider',
      area: driverArea || '',
      status: 'active',
      publicId,
    });

    await user.save();
    res.json({ success: true, message: `تم إضافة السائق (${driverName}) بنجاح!`, password: 'Pass1234' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'provider') return res.json({ success: false, message: 'السائق غير موجود' });

    const newStatus = req.body.status === 'active' ? 'active' : 'blocked';
    driver.status = newStatus;
    await driver.save();

    const io = req.app.get('io');
    if (io) {
      if (newStatus === 'blocked') {
        await Notification.create({
          userId: driver._id, type: 'broadcast', pinned: true,
          title: 'تم تجميد حسابك',
          body: 'تم تجميد حسابك بسبب كثرة البلاغات. يرجى التواصل مع فريق الدعم.',
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        io.to(`user:${driver._id}`).emit('notification_count', { unreadCount: 1 });
        io.to(`user:${driver._id}`).emit('broadcast', {
          title: 'تم تجميد حسابك',
          body: 'تم تجميد حسابك بسبب كثرة البلاغات. يرجى التواصل مع فريق الدعم.',
          action: 'contact_support',
        });
      } else {
        await Notification.create({
          userId: driver._id, type: 'broadcast', pinned: true,
          title: 'تم تفعيل حسابك',
          body: 'مبروك! تم إعادة تفعيل حسابك بنجاح. يمكنك الآن استخدام التطبيق بشكل طبيعي.',
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        io.to(`user:${driver._id}`).emit('notification_count', { unreadCount: 1 });
        io.to(`user:${driver._id}`).emit('broadcast', {
          title: 'تم تفعيل حسابك',
          body: 'مبروك! تم إعادة تفعيل حسابك بنجاح.',
          action: '',
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/password', async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'provider') return res.json({ success: false, message: 'السائق غير موجود' });
    driver.password = await bcrypt.hash(req.body.password, 10);
    await driver.save();
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'provider') return res.json({ success: false, message: 'السائق غير موجود' });
    driver.deleted = true;
    driver.status = 'blocked';
    await driver.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${driver._id}`).emit('account_deleted', {});
    }

    res.json({ success: true, message: `تم حذف السائق (${driver.fullName}) بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Pending Provider Signups
router.get('/pending', async (req, res) => {
  try {
    const pending = await PendingProvider.find().sort({ createdAt: -1 }).lean();
    res.json(pending.map(p => ({ ...p, password: undefined })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save docs + info from add-driver form for a pending provider
router.post('/pending/:id', upload.none(), async (req, res) => {
  try {
    const pending = await PendingProvider.findById(req.params.id);
    if (!pending) return res.json({ success: false, message: 'طلب التسجيل غير موجود' });

    const { driverServiceType, driverLicenseType, driverArea } = req.body;
    const publicId = await generatePublicId();

    await User.create({
      fullName: pending.fullName,
      name: pending.fullName,
      email: pending.email,
      phoneNumbers: [{ number: pending.phone, primary: true }],
      password: pending.password,
      role: 'provider',
      area: driverArea || pending.area || '',
      publicId,
      primaryPhone: pending.phone,
      status: 'pending',
    });

    await PendingProvider.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `تم حفظ بيانات السائق (${pending.fullName}). يمكنك الآن قبوله من قائمة طلبات التسجيل.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pending/:id/approve', async (req, res) => {
  try {
    const pending = await PendingProvider.findById(req.params.id);
    if (pending) {
      // Not yet entered via docs — create user now
      const publicId = await generatePublicId();
      await User.create({
        fullName: pending.fullName,
        email: pending.email,
        phoneNumbers: [{ number: pending.phone, primary: true }],
        password: pending.password,
        role: 'provider',
        area: pending.area,
        publicId,
        primaryPhone: pending.phone,
        status: 'active',
      });
      await PendingProvider.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: `تم قبول السائق (${pending.fullName}) بنجاح` });
    }

    // User already created via docs flow — just activate
    const user = await User.findOne({ email: req.query.email });
    if (!user) return res.json({ success: false, message: 'لم يتم العثور على السائق. يرجى إدخال الوثائق أولاً.' });
    user.status = 'active';
    await user.save();
    res.json({ success: true, message: `تم تفعيل حساب السائق (${user.fullName}) بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/pending/:id/reject', async (req, res) => {
  try {
    const pending = await PendingProvider.findByIdAndDelete(req.params.id);
    if (!pending) return res.json({ success: false, message: 'طلب التسجيل غير موجود' });

    res.json({ success: true, message: `تم رفض طلب السائق (${pending.fullName})` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
