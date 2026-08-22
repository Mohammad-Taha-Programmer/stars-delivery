function isAdminSession(req) {
  return req.session?.admin?.id && req.session.admin.role === 'admin';
}

module.exports = (req, res, next) => {
  if (isAdminSession(req)) return next();

  if (req.originalUrl?.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.redirect('/admin/login');
};

module.exports.isAdminSession = isAdminSession;