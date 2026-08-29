const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

router.get('/search', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.json({ error: 'الرجاء إدخال ID المستخدم أو الاسم' });

    const user = await User.findOne({
      role: 'customer',
      $or: [
        { publicId: id },
        { fullName: { $regex: id, $options: 'i' } },
      ],
    }).lean();

    if (!user) return res.json({ error: 'لم يتم العثور على مستخدم' });

    const orders = await Order.find({ customerId: user._id }).lean();
    const mappedUser = {
      _id: user._id.toString(),
      userId: user.publicId || user._id.toString().slice(-8),
      name: user.fullName || user.name,
      email: user.email,
      phone: user.phone,
      joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'غير محدد',
      area: user.area || 'غير محدد',
      status: user.status === 'blocked' ? 'inactive' : user.status,
      password: '****',
      orders: orders.map(o => ({
        orderId: o._id.toString().slice(-8),
        type: o.type || 'غير محدد',
        date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : 'غير محدد',
        status: o.status,
        amount: o.price || 0,
        driver: o.providerId?.toString() || 'غير محدد',
        content: o.description || ''
      })),
      messages: user.messages || []
    };

    res.json({ user: mappedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'customer') return res.json({ success: false, message: 'المستخدم غير موجود' });

    const newStatus = req.body.status === 'active' ? 'active' : 'blocked';
    user.status = newStatus;
    await user.save();

    const io = req.app.get('io');
    if (io) {
      if (newStatus === 'blocked') {
        await Notification.create({
          userId: user._id, type: 'broadcast', pinned: true,
          title: 'تم تجميد حسابك',
          body: 'تم تجميد حسابك بسبب كثرة البلاغات. يرجى التواصل مع فريق الدعم.',
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        io.to(`user:${user._id}`).emit('notification_count', { unreadCount: 1 });
        io.to(`user:${user._id}`).emit('broadcast', {
          title: 'تم تجميد حسابك',
          body: 'تم تجميد حسابك بسبب كثرة البلاغات. يرجى التواصل مع فريق الدعم.',
          action: 'contact_support',
        });

        io.in(`user:${user._id}`)
          .disconnectSockets(true);
      } else {
        await Notification.create({
          userId: user._id, type: 'broadcast', pinned: true,
          title: 'تم تفعيل حسابك',
          body: 'مبروك! تم إعادة تفعيل حسابك بنجاح. يمكنك الآن استخدام التطبيق بشكل طبيعي.',
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        io.to(`user:${user._id}`).emit('notification_count', { unreadCount: 1 });
        io.to(`user:${user._id}`).emit('broadcast', {
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
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.json({ success: false, message: 'المستخدم غير موجود' });
    user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.json({ success: false, message: 'المستخدم غير موجود' });
    // Soft delete: keeps data for legal reasons, prevents login
    user.deleted = true;
    user.status = 'blocked';
    await user.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user._id}`).emit('account_deleted', {});
    }

    res.json({ success: true, message: `تم حذف المستخدم (${user.fullName}) بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
