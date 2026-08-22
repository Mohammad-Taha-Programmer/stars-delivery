const express = require('express');
const router = express.Router();
const User = require('../models/User');

const governorateOrder = ['القدس', 'رام الله والبيرة', 'الخليل', 'نابلس', 'بيت لحم', 'أريحا', 'سلفيت', 'جنين', 'طولكرم', 'قلقيلية', 'طوباس', 'غزة', 'خان يونس', 'رفح', 'دير البلح', 'شمال غزة', 'حيفا', 'عكا', 'الناصرة', 'يافا'];

router.get('/', async (req, res) => {
  try {
    const drivers = await User.find({ role: 'provider' }).lean();
    const users = await User.find({ role: 'customer' }).lean();

    const areaCounts = {};
    drivers.forEach(d => {
      const area = d.governorate || d.area || 'غير محدد';
      if (!areaCounts[area]) areaCounts[area] = { totalDrivers: 0, totalUsers: 0 };
      areaCounts[area].totalDrivers++;
    });
    users.forEach(u => {
      const area = u.governorate || u.area || 'غير محدد';
      if (!areaCounts[area]) areaCounts[area] = { totalDrivers: 0, totalUsers: 0 };
      areaCounts[area].totalUsers++;
    });

    const stats = {};
    for (const [area, counts] of Object.entries(areaCounts)) {
      stats[area] = {
        totalDrivers: counts.totalDrivers,
        totalUsers: counts.totalUsers,
        cities: [{ name: area, drivers: counts.totalDrivers, users: counts.totalUsers }]
      };
    }

    res.json({ stats, governorateOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
