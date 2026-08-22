const express = require('express');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.post('/', auth, requireRole('provider'), async (req, res) => {
  try {
    const { orderId, price, estimatedTime } = req.body;

    if (!orderId || !price || price <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['pending', 'offered'].includes(order.status)) return res.status(400).json({ error: 'Order is no longer accepting offers' });

    const existing = await Offer.findOne({ orderId, providerId: req.userId });
    if (existing) return res.status(400).json({ error: 'You already submitted an offer for this order' });

    const provider = await User.findById(req.userId);
    if (provider.status === 'blocked' || provider.deleted) {
      return res.status(403).json({ error: 'تم تجميد حسابك. يرجى التواصل مع الدعم.' });
    }

    const offer = await Offer.create({ orderId, providerId: req.userId, price, estimatedTime: estimatedTime || 0 });

    await Order.findByIdAndUpdate(orderId, { status: 'offered' });

    await Notification.create({
      userId: order.customerId,
      orderId,
      type: 'new_offer',
      title: 'عرض سعر جديد',
      body: `السائق ${provider.fullName} قدم عرض سعر بقيمة ${price} شيكل`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.customerId}`).emit('new_offer', {
        orderId,
        offerId: offer._id,
        price,
        estimatedTime: estimatedTime || 0,
        providerName: provider.fullName,
        providerPhone: provider.phone,
      });
    }

    res.status(201).json(offer.toObject());
  } catch (err) {
    console.error('Create offer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Resend rejected order to other providers
router.post('/:orderId/resend', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    // Reset order to pending so other providers can see it
    order.status = 'pending';
    order.providerId = null;
    order.price = 0;
    order.providerEarning = 0;
    order.platformCommission = 0;
    await order.save();

    // Reject all existing offers on this order
    await Offer.updateMany({ orderId: order._id }, { status: 'rejected' });

    res.json({ success: true, message: 'تم إعادة إرسال الطلب لمزودي الخدمة الآخرين' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel order (hide from reports but keep in DB)
router.post('/:orderId/cancel', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    order.status = 'cancelled';
    await order.save();

    await Offer.updateMany({ orderId: order._id, status: 'pending' }, { status: 'rejected' });

    res.json({ success: true, message: 'تم إلغاء الطلب' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/order/:orderId', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, customerId: req.userId }).select('_id');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const offers = await Offer.find({ orderId: req.params.orderId })
      .populate('providerId', 'fullName phone area publicId')
      .populate('orderId', 'description area type')
      .sort({ createdAt: -1 })
      .lean();
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/accept', auth, requireRole('customer'), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('orderId');
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const order = offer.orderId;
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if order already accepted by another customer
    if (order.status === 'accepted' || order.status === 'fulfilling' || order.status === 'completed') {
      // Another customer already accepted — race condition loss
      offer.status = 'rejected';
      await offer.save();
      return res.json({ conflict: true, message: 'عذراً، مزود الخدمة غير متاح حالياً. هل تريد إعادة إرسال الطلب لمزودي خدمة آخرين؟' });
    }

    // Check if provider is currently blocked
    const provider = await User.findById(offer.providerId);
    if (provider.blockedUntil && provider.blockedUntil > new Date()) {
      offer.status = 'rejected';
      await offer.save();
      return res.json({ conflict: true, message: 'عذراً، مزود الخدمة غير متاح حالياً. هل تريد إعادة إرسال الطلب لمزودي خدمة آخرين؟' });
    }

    offer.status = 'accepted';
    await offer.save();

    const commission = 1;
    const providerEarning = offer.price - commission;

    await Order.findByIdAndUpdate(order._id, {
      status: 'accepted',
      providerId: offer.providerId,
      price: offer.price,
      providerEarning,
      platformCommission: commission,
    });

    // Block provider for 30 minutes
    const blockUntil = new Date(Date.now() + 30 * 60 * 1000);
    await User.findByIdAndUpdate(offer.providerId, { blockedUntil: blockUntil });

    // Reject all other pending offers from this provider on OTHER orders
    await Offer.updateMany(
      { providerId: offer.providerId, status: 'pending', _id: { $ne: offer._id } },
      { status: 'rejected' }
    );

    // Reject other offers on THIS order
    await Offer.updateMany(
      { orderId: order._id, _id: { $ne: offer._id } },
      { status: 'rejected' }
    );

    const customer = await User.findById(req.userId);
    await Notification.create({
      userId: offer.providerId,
      orderId: order._id,
      type: 'offer_accepted',
      title: 'تم قبول عرضك',
      body: `السيد ${customer.fullName} قبل عرضك للطلب #${order._id}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${offer.providerId}`).emit('offer_accepted', {
        orderId: order._id,
        price: offer.price,
      });
    }

    res.json({ message: 'Offer accepted' });
  } catch (err) {
    console.error('Accept offer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;