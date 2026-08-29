const { sendInternalServerError, sendInternalServerFailure } = require('../security/errorResponse');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/messages/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    let target;
    if (type === 'driver') {
      target = await User.findOne({ _id: id, role: 'provider' });
    } else {
      target = await User.findOne({ _id: id, role: 'customer' });
    }
    if (!target) return res.json({ error: 'الطرف غير موجود' });
    res.json({ messages: target.messages || [], name: target.fullName || target.name, type });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.post('/send/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { text } = req.body;
    if (!text) return res.json({ success: false, message: 'الرجاء كتابة رسالة' });

    let target;
    if (type === 'driver') {
      target = await User.findOne({ _id: id, role: 'provider' });
    } else {
      target = await User.findOne({ _id: id, role: 'customer' });
    }
    if (!target) return res.json({ success: false, message: 'الطرف غير موجود' });

    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (!target.messages) target.messages = [];
    target.messages.push({ sender: 'admin', text, time });
    await target.save();

    const responses = ['شكراً لك على تواصلك.', 'سأقوم بمراجعة ذلك.', 'تم استلام رسالتك.', 'أنا حالياً مشغول، سأرد لاحقاً.', 'ممتاز، سأعمل على ذلك.', 'هل يمكنك توضيح أكثر؟', 'أنا في الطريق الآن.', 'تم إنجاز المطلوب.', 'سأتصل بك لاحقاً.', 'أنا بحاجة للمزيد من التفاصيل.'];
    const autoReply = responses[Math.floor(Math.random() * responses.length)];
    const autoReplyTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    target.messages.push({ sender: 'other', text: autoReply, time: autoReplyTime });
    await target.save();

    res.json({ success: true, messages: target.messages });
  } catch (err) {
    sendInternalServerFailure(res);
  }
});

module.exports = router;
