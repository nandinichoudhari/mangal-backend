const express = require('express');
const fast2sms = require('fast2sms').default;
const User = require('../models/User');
const router = express.Router();

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    // Save OTP (in production use Redis)
    await User.findOneAndUpdate(
      { phone },
      { phone, otp: otp.toString() },
      { upsert: true, new: true }
    );

    // Send SMS (test with 1234 first)
    if (process.env.FAST2SMS_KEY !== 'test') {
      fast2sms.sendMessage({
        authorization: process.env.FAST2SMS_KEY,
        message: `Mangal Enterprises OTP: ${otp}`,
        numbers: [phone]
      });
    }

    res.json({ success: true, message: 'OTP sent!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone, otp });
    
    if (!user) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    // Clear OTP after verification
    user.otp = undefined;
    await user.save();

    res.json({ 
      success: true, 
      user: { phone: user.phone, name: user.name || 'Customer' },
      token: 'temp_jwt_' + phone // Replace with real JWT
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
