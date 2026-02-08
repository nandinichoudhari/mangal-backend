const express = require('express');
const router = express.Router();

const Otp = require('../models/Otp');
const User = require('../models/User');

// 🔴 ADD THIS LINE FOR DEBUG (temporary)
console.log('✅ otp routes file loaded');

// SEND OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone required' });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();


  await Otp.deleteMany({ phone });

  await Otp.create({
    phone,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  console.log('OTP:', otp);

  res.json({ success: true, message: 'OTP sent' });
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  const otpRecord = await Otp.findOne({ phone, otp });

  if (!otpRecord) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone, isVerified: true });
  } else {
    user.isVerified = true;
    await user.save();
  }

  await Otp.deleteMany({ phone });

  res.json({ success: true, message: 'Login successful', user });
});

module.exports = router;
