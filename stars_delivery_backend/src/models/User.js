const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['admin', 'other'], required: true },
  text: { type: String, required: true },
  time: { type: String, default: () => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phoneNumbers: [{
    number: { type: String, required: true },
    primary: { type: Boolean, default: false },
  }],
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'provider', 'admin'], required: true },
  area: { type: String, default: '' },
  publicId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['active', 'blocked', 'pending', 'inactive'], default: 'active' },
  commissionPaid: { type: Boolean, default: false },
  blockedUntil: { type: Date, default: null },
  offerSequence: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false },
  privacyPolicy: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  complaints: [{ type: String }],
  frequentItems: [{ type: String }],
  lastLatitude: { type: Number },
  lastLongitude: { type: Number },
  lastLocationUpdate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // Admin panel fields
  name: { type: String },
  governorate: { type: String },
  messages: [messageSchema]
});

module.exports = mongoose.model('User', userSchema);
