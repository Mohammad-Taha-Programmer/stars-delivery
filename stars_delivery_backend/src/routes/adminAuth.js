const express = require('express');
const router = express.Router();

const ADMIN_USERNAME = 'admin';
let ADMIN_PASSWORD = 'admin123';

router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.admin = { username };
    return res.redirect('/admin');
  }
  res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

router.post('/reset-password', (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (currentPassword !== ADMIN_PASSWORD) {
    return res.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
  }
  if (newPassword.length < 6) {
    return res.json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  }
  if (newPassword !== confirmPassword) {
    return res.json({ success: false, message: 'كلمة المرور وتأكيدها غير متطابقين' });
  }
  ADMIN_PASSWORD = newPassword;
  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
