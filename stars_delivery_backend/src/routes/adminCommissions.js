const { sendInternalServerError, sendInternalServerFailure } = require('../security/errorResponse');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' }).lean();
    let totalUnpaid = 0, totalPaid = 0, unpaidDrivers = 0, paidDrivers = 0;
    const driverRows = [];

    for (const driver of providers) {
      const orders = await Order.find({
        providerId: driver._id,
        status: { $in: ['accepted', 'fulfilling', 'completed'] },
      }).lean();
      const totalCommission = orders.reduce((s, o) => s + (o.platformCommission || 0), 0);
      const totalEarnings = orders.reduce((s, o) => s + (o.providerEarning || 0), 0);

      const isPaid = driver.commissionPaid === true;
      if (isPaid) { totalPaid += totalCommission; paidDrivers++; }
      else { totalUnpaid += totalCommission; unpaidDrivers++; }

      driverRows.push({
        _id: driver._id.toString(),
        driverId: driver._id.toString().slice(-8),
        name: driver.fullName || driver.name,
        phone: driver.phone,
        serviceType: 'توصيل',
        commission: totalCommission,
        earnings: totalEarnings,
        paymentStatus: isPaid ? 'paid' : 'unpaid'
      });
    }

    driverRows.sort((a, b) => b.commission - a.commission);
    res.json({ totalUnpaid, totalPaid, unpaidDrivers, paidDrivers, driverRows });
  } catch (err) {
    sendInternalServerError(res);
  }
});

router.put('/pay/:id', async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'provider') return res.json({ success: false, message: 'السائق غير موجود' });
    driver.commissionPaid = true;
    await driver.save();
    res.json({ success: true, message: `تم تحديث حالة السائق (${driver.fullName}) إلى مدفوع` });
  } catch (err) {
    sendInternalServerFailure(res);
  }
});

module.exports = router;
