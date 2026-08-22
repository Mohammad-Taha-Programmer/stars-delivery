const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireAdminSession = require('../middleware/requireAdminSession');

const router = express.Router();

router.get('/history', auth, requireRole('customer', 'provider'), async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.userId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send', auth, requireRole('customer', 'provider'), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message is required' });

    const msg = await ChatMessage.create({
      userId: req.userId,
      sender: 'user',
      text: text.trim(),
    });

    // Mark previous admin messages as read
    await ChatMessage.updateMany({ userId: req.userId, sender: 'admin', read: false }, { read: true });

    const io = req.app.get('io');
    if (io) {
      const user = await User.findById(req.userId, 'fullName publicId role');
      io.to('support').emit('support_message', {
        _id: msg._id,
        userId: req.userId,
        userName: user?.fullName || '',
        userPublicId: user?.publicId || '',
        userRole: user?.role || '',
        text: msg.text,
        createdAt: msg.createdAt,
      });
    }

    res.status(201).json(msg.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoints (session-based)
router.use('/admin', requireAdminSession);

router.get('/admin/conversations', async (req, res) => {
  try {
    const conversations = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$userId', lastMessage: { $first: '$text' }, lastTime: { $first: '$createdAt' }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] }, 1, 0] } } } },
      { $sort: { lastTime: -1 } },
    ]);

    const userIds = conversations.map(c => c._id);
    const users = await User.find({ _id: { $in: userIds } }, 'fullName publicId role').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const result = conversations.map(c => ({
      userId: c._id,
      userName: userMap[c._id.toString()]?.fullName || 'Unknown',
      userPublicId: userMap[c._id.toString()]?.publicId || '',
      userRole: userMap[c._id.toString()]?.role || '',
      lastMessage: c.lastMessage,
      lastTime: c.lastTime,
      unread: c.unread || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/messages/:userId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.params.userId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    // Mark user messages as read
    await ChatMessage.updateMany({ userId: req.params.userId, sender: 'user', read: false }, { read: true });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/reply/:userId', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message is required' });

    const msg = await ChatMessage.create({
      userId: req.params.userId,
      sender: 'admin',
      text: text.trim(),
      read: false,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.params.userId}`).emit('support_reply', {
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt,
      });
    }

    res.status(201).json(msg.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public contact endpoint (no auth required)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message is required' });

    const displayName = name || 'Guest';
    const guestEmail = `contact_${Date.now()}@guest.local`;
    const user = await User.create({
      fullName: displayName,
      email: guestEmail,
      phone: phone || '0000000000',
      password: 'guest_placeholder',
      role: 'customer',
      area: '',
    });

    const msg = await ChatMessage.create({
      userId: user._id,
      sender: 'user',
      text: `[${displayName}] [${email || ''}] [${phone || ''}]\n${text.trim()}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('support').emit('support_message', {
        _id: msg._id,
        userId: user._id,
        userName: displayName,
        userPublicId: '',
        userRole: 'customer',
        text: `[${displayName}] [${email || ''}] [${phone || ''}]\n${text.trim()}`,
        createdAt: msg.createdAt,
      });
    }

    res.json({ success: true, message: 'تم إرسال رسالتك. سنتواصل معك قريباً.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/resolve/:userId', async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.params.userId });
    res.json({ success: true, message: 'تم حذف المحادثة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
