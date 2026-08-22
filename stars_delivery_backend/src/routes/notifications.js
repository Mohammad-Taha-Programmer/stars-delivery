const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!notif) return res.status(404).json({ error: 'Not found' });
    // Pinned notifications disappear immediately when read
    if (notif.pinned) {
      await Notification.findByIdAndDelete(req.params.id);
    } else {
      notif.read = true;
      await notif.save();
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    // Pinned notifications get deleted; regular ones marked read
    await Notification.deleteMany({ userId: req.userId, pinned: true });
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;