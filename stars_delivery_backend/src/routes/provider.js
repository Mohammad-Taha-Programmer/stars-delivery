const { sendInternalServerError } = require('../security/errorResponse');
const express = require('express');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
router.use(auth, requireRole('provider'));

router.get('/stats', async (req, res) => {
  const t0 = Date.now();
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const match = { providerId: req.userId, status: { $in: ['accepted', 'fulfilling', 'completed'] } };

    const t1 = Date.now();
    const [dailyOrders, monthlyOrders, user] = await Promise.all([
      Order.find({ ...match, createdAt: { $gte: startOfDay } }).lean(),
      Order.find({ ...match, createdAt: { $gte: startOfMonth } }).lean(),
      User.findById(req.userId),
    ]);
    const t2 = Date.now();

    // Registered area is authoritative; GPS-detected area is a fallback only
    const qArea = user.area || req.query.area || '';
    const areaFilter = qArea ? { area: qArea, status: { $in: ['pending', 'offered'] } } : { status: { $in: ['pending', 'offered'] } };
    // Exclude orders this provider already offered on
    const offeredIds = await Offer.find({ providerId: req.userId }).distinct('orderId');
    if (offeredIds.length > 0) areaFilter._id = { $nin: offeredIds };
    const pendingOrdersCount = await Order.countDocuments(areaFilter);
    const t3 = Date.now();

    const totalSuccessful = monthlyOrders.filter(o => o.status === 'completed').length;
    const dailyOrderCount = dailyOrders.length;
    const activeOrdersCount = await Order.countDocuments({ providerId: req.userId, status: { $in: ['accepted', 'fulfilling'] } });
    const offeredOrdersCount = offeredIds.length > 0
      ? await Order.countDocuments({ _id: { $in: offeredIds }, status: { $in: ['pending', 'offered'] } })
      : 0;

    const dbTime = t2 - t1;
    const countTime = t3 - t2;
    const totalTime = Date.now() - t0;
    console.log(`[STATS] userId=${req.userId} area="${qArea}" pending=${pendingOrdersCount} total=${totalTime}ms`);
    if (totalTime > 1000) {
      console.warn(`[SLOW] /stats took ${totalTime}ms (queries: ${dbTime}ms, count: ${countTime}ms)`);
    }

    res.json({
      dailyEarnings: dailyOrders.reduce((s, o) => s + (o.providerEarning || 0), 0),
      monthlyEarnings: monthlyOrders.reduce((s, o) => s + (o.providerEarning || 0), 0),
      totalSuccessful,
      dailyOrderCount,
      dailyCommission: dailyOrders.reduce((s, o) => s + (o.platformCommission || 0), 0),
      monthlyCommission: monthlyOrders.reduce((s, o) => s + (o.platformCommission || 0), 0),
      pendingOrdersCount,
      offeredOrdersCount,
      activeOrdersCount,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    sendInternalServerError(res);
  }
});

router.get('/pending-orders', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    // Registered area is authoritative; GPS-detected area is a fallback only
    const qArea = user.area || req.query.area || '';
    const areaFilter = qArea ? { area: qArea, status: { $in: ['pending', 'offered'] } } : { status: { $in: ['pending', 'offered'] } };
    // Exclude orders where this provider already submitted an offer
    const offeredIds = await Offer.find({ providerId: req.userId }).distinct('orderId');
    if (offeredIds.length > 0) areaFilter._id = { $nin: offeredIds };
    const orders = await Order.find(areaFilter).sort({ createdAt: -1 })
      .populate('customerId', 'fullName publicId')
      .lean();

    console.log(`[PENDING] userId=${req.userId} area="${qArea}" count=${orders.length}`);

    const masked = orders.map(o => ({
      ...o, phone: o.phone ? o.phone.slice(0, -3) + '***' : '',
    }));
    res.json(masked);
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.get('/offered-orders', async (req, res) => {
  try {
    // Find orders where this provider has submitted an offer but order is not yet accepted
    const offers = await Offer.find({ providerId: req.userId, status: 'pending' }).lean();
    const offeredIds = offers.map(o => o.orderId);
    const orders = await Order.find({
      _id: { $in: offeredIds },
      status: { $in: ['pending', 'offered'] },
    }).populate('customerId', 'fullName publicId').sort({ createdAt: -1 }).lean();

    const offerMap = {};
    offers.forEach(o => { offerMap[o.orderId.toString()] = { price: o.price, estimatedTime: o.estimatedTime || 0 }; });

    const masked = orders.map(o => ({
      ...o,
      phone: o.phone ? o.phone.slice(0, -3) + '***' : '',
      offeredPrice: offerMap[o._id.toString()]?.price || 0,
      offeredTime: offerMap[o._id.toString()]?.estimatedTime || 0,
    }));
    res.json(masked);
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ providerId: req.userId }).sort({ createdAt: -1 })
      .populate('customerId', 'fullName publicId')
      .lean();
    res.json(orders);
  } catch (err) {
    sendInternalServerError(res);
  }
});

module.exports = router;