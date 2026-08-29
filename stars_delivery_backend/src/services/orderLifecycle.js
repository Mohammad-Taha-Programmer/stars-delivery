const mongoose = require('mongoose');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { executeTransaction } = require('./transaction');
const { ACCEPTABLE_OFFER_ORDER_STATES, canAcceptOfferRecord, nextProviderStatus } = require('./orderState');

const ACCEPTABLE_ORDER_STATUSES = ACCEPTABLE_OFFER_ORDER_STATES;
const CONFLICT_MESSAGES = {
  ORDER_NOT_AVAILABLE: 'The order is no longer available for this action.',
  OFFER_NOT_AVAILABLE: 'The offer is no longer available.',
  PROVIDER_BUSY: 'The provider is not currently available.',
  INVALID_TRANSITION: 'The order cannot move to that status.',
};

class LifecycleConflict extends Error {
  constructor(code, orderId) {
    super(CONFLICT_MESSAGES[code] || 'The operation conflicts with the current state.');
    this.name = 'LifecycleConflict';
    this.code = code;
    this.orderId = orderId?.toString();
    this.status = 409;
  }
}

function conflictResponse(error) {
  return {
    conflict: true,
    code: error.code,
    message: error.message,
    ...(error.orderId ? { orderId: error.orderId } : {}),
  };
}

function isTransactionUnavailable(error) {
  return error?.code === 20
    || error?.codeName === 'IllegalOperation'
    || /transaction|replica set|mongos/i.test(error?.message || '');
}

async function inTransaction(work) {
  return executeTransaction({ startSession: () => mongoose.startSession(), work });
}

async function acceptOffer({ offerId, customerId }) {
  return inTransaction(async (session) => {
    const offer = await Offer.findOne({ _id: offerId, status: 'pending' })
      .populate('orderId')
      .session(session)
      .lean();
    if (!offer) throw new LifecycleConflict('OFFER_NOT_AVAILABLE');

    const order = offer.orderId;
    if (!order || !canAcceptOfferRecord(offer.status, order.status) || order.customerId.toString() !== customerId.toString()) {
      throw new LifecycleConflict('ORDER_NOT_AVAILABLE', order?._id);
    }

    const blockUntil = new Date(Date.now() + 30 * 60 * 1000);
    const provider = await User.findOneAndUpdate({
      _id: offer.providerId,
      role: 'provider',
      status: 'active',
      deleted: { $ne: true },
      $or: [{ blockedUntil: null }, { blockedUntil: { $exists: false } }, { blockedUntil: { $lte: new Date() } }],
    }, { $set: { blockedUntil: blockUntil } }, { new: true, session }).lean();
    if (!provider) throw new LifecycleConflict('PROVIDER_BUSY', order._id);

    const orderUpdate = await Order.updateOne({
      _id: order._id,
      customerId,
      status: { $in: ACCEPTABLE_ORDER_STATUSES },
    }, {
      $set: {
        status: 'accepted',
        providerId: offer.providerId,
        price: offer.price,
        providerEarning: offer.price - 1,
        platformCommission: 1,
      },
    }, { session });
    if (orderUpdate.modifiedCount !== 1) throw new LifecycleConflict('ORDER_NOT_AVAILABLE', order._id);

    const offerUpdate = await Offer.updateOne({ _id: offer._id, status: 'pending' }, { $set: { status: 'accepted' } }, { session });
    if (offerUpdate.modifiedCount !== 1) throw new LifecycleConflict('OFFER_NOT_AVAILABLE', order._id);

    await Offer.updateMany({ orderId: order._id, _id: { $ne: offer._id } }, { $set: { status: 'rejected' } }, { session });
    await Offer.updateMany({ providerId: offer.providerId, status: 'pending', _id: { $ne: offer._id } }, { $set: { status: 'rejected' } }, { session });

    const customer = await User.findById(customerId).select('fullName').session(session).lean();
    await Notification.create([{
      userId: offer.providerId,
      orderId: order._id,
      type: 'offer_accepted',
      title: 'تم قبول عرضك',
      body: `السيد ${customer?.fullName || ''} قبل عرضك للطلب #${order._id}`,
    }], { session });

    return {
      orderId: order._id,
      providerId: offer.providerId,
      price: offer.price,
      event: { orderId: order._id, price: offer.price },
    };
  });
}

async function submitOffer({ orderId, providerId, price, estimatedTime }) {
  return inTransaction(async (session) => {
    const provider = await User.findOneAndUpdate({
      _id: providerId,
      role: 'provider',
      status: 'active',
      deleted: { $ne: true },
      $or: [{ blockedUntil: null }, { blockedUntil: { $exists: false } }, { blockedUntil: { $lte: new Date() } }],
    }, { $inc: { offerSequence: 1 } }, { new: true, session }).lean();
    if (!provider) throw new LifecycleConflict('PROVIDER_BUSY', orderId);

      // The provider write above is the serialization point for concurrent
      // submissions by the same provider. If another transaction commits
      // first, withTransaction retries this transaction on a fresh snapshot;
      // this lookup then observes the existing offer and rejects the duplicate.
      // This avoids automatically creating a unique index against unknown
      // existing production data before an explicit duplicate-data audit.
      const existingOffer = await Offer.findOne({ orderId, providerId })
        .select('_id')
        .session(session)
        .lean();
      if (existingOffer) throw new LifecycleConflict('OFFER_NOT_AVAILABLE', orderId);

    const orderUpdate = await Order.updateOne({ _id: orderId, status: { $in: ACCEPTABLE_ORDER_STATUSES } }, { $set: { status: 'offered' } }, { session });
    if (orderUpdate.matchedCount !== 1) throw new LifecycleConflict('ORDER_NOT_AVAILABLE', orderId);

    let offer;
    try {
      [offer] = await Offer.create([{ orderId, providerId, price, estimatedTime: estimatedTime || 0 }], { session });
    } catch (error) {
      if (error?.code === 11000) throw new LifecycleConflict('OFFER_NOT_AVAILABLE', orderId);
      throw error;
    }

    const order = await Order.findById(orderId).select('customerId').session(session).lean();
    await Notification.create([{
      userId: order.customerId,
      orderId,
      type: 'new_offer',
      title: 'عرض سعر جديد',
      body: `السائق ${provider.fullName} قدم عرض سعر بقيمة ${price} شيكل`,
    }], { session });
    return { offer: offer.toObject(), customerId: order.customerId, providerName: provider.fullName, providerPhone: provider.phone };
  });
}

async function resetOrder({ orderId, customerId }) {
  return inTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate({ _id: orderId, customerId, status: { $in: ACCEPTABLE_ORDER_STATUSES } }, {
      $set: { status: 'pending', providerId: null, price: 0, providerEarning: 0, platformCommission: 0 },
    }, { new: true, session }).lean();
    if (!updated) throw new LifecycleConflict('ORDER_NOT_AVAILABLE', orderId);
    await Offer.updateMany({ orderId }, { $set: { status: 'rejected' } }, { session });
    return updated;
  });
}

async function cancelOrder({ orderId, customerId }) {
  return inTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate({ _id: orderId, customerId, status: { $in: ACCEPTABLE_ORDER_STATUSES } }, { $set: { status: 'cancelled' } }, { new: true, session }).lean();
    if (!updated) throw new LifecycleConflict('ORDER_NOT_AVAILABLE', orderId);
    await Offer.updateMany({ orderId, status: 'pending' }, { $set: { status: 'rejected' } }, { session });
    return updated;
  });
}

async function transitionOrder({ orderId, providerId, from, to }) {
  if (nextProviderStatus(from) !== to) throw new LifecycleConflict('INVALID_TRANSITION', orderId);
  return inTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate({ _id: orderId, providerId, status: from }, { $set: { status: to } }, { new: true, session }).lean();
    if (!updated) throw new LifecycleConflict('INVALID_TRANSITION', orderId);
    await Notification.create([{
      userId: updated.customerId,
      orderId: updated._id,
      type: to === 'completed' ? 'order_completed' : 'order_pending',
      title: to === 'completed' ? 'تم اكتمال الطلب' : 'جاري تنفيذ الطلب',
      body: to === 'completed' ? 'تم تسليم طلبك بنجاح' : 'السائق يقوم بتنفيذ طلبك الآن',
    }], { session });
    return updated;
  });
}

module.exports = {
  ACCEPTABLE_ORDER_STATUSES,
  LifecycleConflict,
  conflictResponse,
  isTransactionUnavailable,
  acceptOffer,
  submitOffer,
  resetOrder,
  cancelOrder,
  transitionOrder,
};