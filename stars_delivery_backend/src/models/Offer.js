const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  estimatedTime: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

offerSchema.index({ orderId: 1, createdAt: -1 });
offerSchema.index({ providerId: 1, orderId: 1 });

module.exports = mongoose.model('Offer', offerSchema);