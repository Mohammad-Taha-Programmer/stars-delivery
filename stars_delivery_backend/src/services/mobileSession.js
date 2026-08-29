const {
  isMobileRole,
} = require('../middleware/mobileRole');

function isActiveMobileAccount(
  user,
  expectedRole,
) {
  if (!user || !isMobileRole(user.role)) {
    return false;
  }

  if (
    expectedRole
    && user.role !== expectedRole
  ) {
    return false;
  }

  return user.deleted !== true
    && user.status === 'active';
}

function publicMobileUser(user) {
  const phones =
    Array.isArray(user.phoneNumbers)
      ? user.phoneNumbers
      : [];

  const primaryPhone =
    phones.find(
      phone => phone?.primary,
    )?.number
    || phones[0]?.number
    || '';

  return {
    id:
      user._id?.toString?.()
      || user.id?.toString?.()
      || '',
    fullName: user.fullName || '',
    email: user.email || '',
    phone: primaryPhone,
    role: user.role || '',
    area: user.area || '',
    publicId: user.publicId || '',
  };
}

module.exports = {
  isActiveMobileAccount,
  publicMobileUser,
};
