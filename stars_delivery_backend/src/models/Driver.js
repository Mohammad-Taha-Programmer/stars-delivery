const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['admin', 'other'], required: true },
  text: { type: String, required: true },
  time: { type: String, default: () => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  desc: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  file: { type: String, default: 'لم يتم الرفع' }
}, { _id: false });

const driverSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  serviceType: { type: String, default: 'توصيل ركاب' },
  licenseType: { type: String, default: 'سائق عمومي مرخص' },
  area: { type: String, default: 'القدس' },
  governorate: { type: String, default: 'القدس' },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  password: { type: String, default: 'Pass1234' },
  documents: [documentSchema],
  messages: [messageSchema],
  financial: {
    paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    receiptNumber: { type: String, default: null },
    transactions: [transactionSchema]
  }
}, { timestamps: true });

driverSchema.index({ driverId: 1 });
driverSchema.index({ governorate: 1 });
driverSchema.index({ area: 1 });
driverSchema.index({ status: 1 });

module.exports = mongoose.model('Driver', driverSchema);
