const { sendInternalServerError, sendInternalServerFailure } = require('../security/errorResponse');
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/:type', async (req, res) => {
  try {
    const reports = await Report.find({ reportType: req.params.type })
      .populate('reporterId', 'fullName publicId')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) return res.json({ error: 'الإبلاغ غير موجود' });
    res.json({ report });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.post('/reply/:id', async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) return res.json({ success: false, message: 'الإبلاغ غير موجود' });
    report.replies.push({
      sender: 'admin',
      text: req.body.text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    sendInternalServerFailure(res);
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) return res.json({ success: false, message: 'الإبلاغ غير موجود' });
    report.status = req.body.status;
    await report.save();
    res.json({ success: true });
  } catch (err) {
    sendInternalServerFailure(res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Report.findOneAndDelete({ reportId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    sendInternalServerFailure(res);
  }
});

module.exports = router;
