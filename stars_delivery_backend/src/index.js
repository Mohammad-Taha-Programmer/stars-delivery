require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const os = require('os');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const providerRoutes = require('./routes/provider');
const offerRoutes = require('./routes/offers');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

const adminAuthRoutes = require('./routes/adminAuth');
const adminDriverRoutes = require('./routes/adminDrivers');
const adminUserRoutes = require('./routes/adminUsers');
const adminReportRoutes = require('./routes/adminReports');
const adminCommissionRoutes = require('./routes/adminCommissions');
const adminAreaRoutes = require('./routes/adminAreas');
const adminBroadcastRoutes = require('./routes/adminBroadcast');
const adminChatRoutes = require('./routes/adminChat');
const adminApiRoutes = require('./routes/adminApi');

const app = express();

function getLanIp() {
  const ifaces = os.networkInterfaces();
  // Skip virtual adapters (VMware, VirtualBox, Hyper-V, WSL) — phones can't reach them
  const virtualNames = /vmware|virtualbox|vethernet|wsl|hyper-v|loopback/i;
  const candidates = [];
  for (const name of Object.keys(ifaces)) {
    if (virtualNames.test(name)) continue;
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) candidates.push(iface.address);
    }
  }
  // Prefer common home-LAN ranges over anything else
  const preferred = candidates.find(ip => ip.startsWith('192.168.1.') || ip.startsWith('192.168.0.') || ip.startsWith('10.'));
  return preferred || candidates[0] || '127.0.0.1';
}
const lanIp = getLanIp();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use('/data', express.static(path.join(__dirname, 'public', 'data')));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views', 'admin'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'tahakum-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.admin || null;
  next();
});

const Order = require('./models/Order');
const Offer = require('./models/Offer');
const Notification = require('./models/Notification');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await Promise.all([
      Order.createIndexes(),
      Offer.createIndexes(),
      Notification.createIndexes(),
      ChatMessage.createIndexes(),
    ]);
    console.log('Indexes ready');
  })
  .catch(err => console.error('MongoDB error:', err));

let server = http.createServer(app);
let io;

const JWT_SECRET = process.env.JWT_SECRET || 'stars_delivery_secret_key_2026';

const setupIO = () => {
  io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  // Admin panel socket connections don't need JWT
  if (socket.handshake.query?.admin === 'true') {
    socket.userId = 'admin';
    socket.userRole = 'admin';
    return next();
  }
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  if (socket.userRole === 'admin') {
    socket.join('support');
    console.log('Admin socket connected (support room)');
  } else if (socket.userRole === 'provider') {
    // Registered area is authoritative; GPS-detected query param is a fallback
    let area = '';
    try {
      const u = await User.findById(socket.userId, 'area');
      area = u?.area || socket.handshake.query?.area || '';
    } catch {
      area = socket.handshake.query?.area || '';
    }
    socket.join(`area:${area}`);
    console.log(`Socket connected: ${socket.userId} (provider) area="${area}"`);
  } else {
    console.log(`Socket connected: ${socket.userId} (${socket.userRole})`);
  }
  socket.join(`user:${socket.userId}`);
});

  io.engine.on('connection_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  app.set('io', io);
};

setupIO();

app.get('/api/config', (req, res) => {
  // Return the address the client actually reached us on — guaranteed reachable.
  let ip = (req.socket.localAddress || '').replace(/^::ffff:/, '');
  if (!ip || ip === '::1' || ip === '127.0.0.1') ip = lanIp;
  res.json({ lanIp: ip, port: parseInt(process.env.PORT || '3000') });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const orderCount = await Order.estimatedDocumentCount();
    const userCount = await User.countDocuments();
    res.json({ status: 'ok', db: dbStatus[dbState] || 'unknown', orders: orderCount, users: userCount });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

app.use('/admin', adminAuthRoutes);

const isAuthenticated = (req, res, next) => {
  if (req.session.admin) return next();
  res.redirect('/admin/login');
};

app.use('/admin/drivers', isAuthenticated, adminDriverRoutes);
app.use('/admin/users', isAuthenticated, adminUserRoutes);
app.use('/admin/reports', isAuthenticated, adminReportRoutes);
app.use('/admin/commissions', isAuthenticated, adminCommissionRoutes);
app.use('/admin/areas', isAuthenticated, adminAreaRoutes);
app.use('/admin/broadcast', isAuthenticated, adminBroadcastRoutes);
app.use('/admin/chat', isAuthenticated, adminChatRoutes);
app.use('/admin/api', isAuthenticated, adminApiRoutes);

app.get('/admin', isAuthenticated, (req, res) => {
  res.render('index', { page: 'dashboard' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;

const startServer = (retries = 3) => {
  server = http.createServer(app);
  setupIO();

  server.listen(PORT, '0.0.0.0')
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (retries > 0) {
          console.error(`Port ${PORT} is in use, retrying in 3s... (${retries} left)`);
          setTimeout(() => startServer(retries - 1), 3000);
        } else {
          console.error(`Port ${PORT} still in use after max retries. Exiting.`);
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    })
    .on('listening', () => {
      console.log(`Server running on port ${PORT} (0.0.0.0)`);
      console.log(`LAN IP: http://${lanIp}:${PORT}`);
    });
};

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

startServer();
