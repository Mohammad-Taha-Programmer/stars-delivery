const mongoose = require('mongoose');

const pendingProviderSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  area: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PendingProvider', pendingProviderSchema);
