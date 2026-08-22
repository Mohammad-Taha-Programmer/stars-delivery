const User = require('../models/User');

function isPattern(num) {
  const s = String(num);
  if (s.length < 2) return false;
  return s.split('').every(c => c === s[0]);
}

function randomPublicId() {
  const digits = 4 + Math.floor(Math.random() * 5); // 4–8 digits
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
}

async function generatePublicId() {
  for (let attempt = 0; attempt < 100; attempt++) {
    const id = randomPublicId();
    if (isPattern(id)) continue;
    const exists = await User.findOne({ publicId: String(id) });
    if (!exists) return String(id);
  }
  throw new Error('Failed to generate unique public ID');
}

module.exports = { generatePublicId };
