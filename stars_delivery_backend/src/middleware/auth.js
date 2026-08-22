const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stars_delivery_secret_key_2026';

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};