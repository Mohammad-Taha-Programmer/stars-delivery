const express = require('express');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
router.use(auth, requireRole('customer', 'provider'));

router.post('/', async (req, res) => {
  try {
    const { reportedPublicId, reportType, content } = req.body;
    if (!reportedPublicId || !content) {
      return res.status(400).json({ error: 'ID ووصف المشكلة مطلوبان' });
    }

    const reportId = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const report = await Report.create({
      reportId,
      reportType: reportType || 'driver',
      reporterId: req.userId,
      reporter: req.userId,
      reportedPublicId,
      category: reportType === 'driver' ? 'الابلاغ عن سائق' : 'الابلاغ عن زبون',
      content,
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
