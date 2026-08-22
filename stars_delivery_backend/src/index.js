require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
const path = require('path');
const { Server } = require('socket.io');
const { loadAppConfig } = require('./config');
const { createAdminSessionMiddleware } = require('./middleware/adminSession');
const requireAdminSession = require('./middleware/requireAdminSession');
const authenticateSocket = require('./socket/authenticateSocket');
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
const appConfig = loadAppConfig();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

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

const sessionMiddleware = createAdminSessionMiddleware({
  mongoUri: appConfig.mongodbUri,
  sessionSecret: appConfig.sessionSecret,
});
app.use(sessionMiddleware);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.admin || null;
  next();
});

const Order = require('./models/Order');
const Offer = require('./models/Offer');
const Notification = require('./models/Notification');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');

mongoose.connect(appConfig.mongodbUri)
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

let server;
let io;

const setupIO = () => {
  io = new Server(server, { cors: { origin: '*' } });
  io.engine.use(sessionMiddleware);

io.use((socket, next) => {
  try {
    const identity = authenticateSocket(socket, appConfig.jwtSecret);
    socket.userId = identity.id;
    socket.userRole = identity.role;
    next();
  } catch (err) {
    next(new Error(err.message));
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

app.use('/admin/drivers', requireAdminSession, adminDriverRoutes);
app.use('/admin/users', requireAdminSession, adminUserRoutes);
app.use('/admin/reports', requireAdminSession, adminReportRoutes);
app.use('/admin/commissions', requireAdminSession, adminCommissionRoutes);
app.use('/admin/areas', requireAdminSession, adminAreaRoutes);
app.use('/admin/broadcast', requireAdminSession, adminBroadcastRoutes);
app.use('/admin/chat', requireAdminSession, adminChatRoutes);
app.use('/admin/api', requireAdminSession, adminApiRoutes);

app.get('/admin', requireAdminSession, (req, res) => {
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

  let retriesRemaining = retries;
  let retryScheduled = false;

  const attemptListen = () => {
    retryScheduled = false;
    server.listen(PORT, '0.0.0.0');
  };

  server.once('listening', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
    console.log(`LAN IP: http://${lanIp}:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retriesRemaining > 0 && !retryScheduled) {
        retriesRemaining -= 1;
        retryScheduled = true;
        console.error(`Port ${PORT} is in use, retrying in 3s... (${retriesRemaining} left)`);
        setTimeout(attemptListen, 3000);
      } else if (retriesRemaining <= 0) {
        console.error(`Port ${PORT} still in use after max retries. Exiting.`);
        process.exit(1);
      }
      return;
    }

    console.error('Server error:', err);
    process.exit(1);
  });

  attemptListen();
};

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

startServer();
