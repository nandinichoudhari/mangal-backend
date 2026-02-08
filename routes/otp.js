const express = require('express');
const router = express.Router();

const Otp = require('../models/Otp');
const User = require('../models/User');

// Debug log (you can remove later)
console.log('✅ OTP routes loaded');

// =====================
// SEND OTP
// =====================
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Remove old OTPs for this phone
    await Otp.deleteMany({ phone });

    // Save new OTP
    await Otp.create({
      phone,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // TEMP: log OTP for dev/testing
    console.log('🔐 OTP for', phone, ':', otp);

    res.json({
      success: true,
      message: 'OTP sent'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// =====================
// VERIFY OTP
// =====================
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    const otpRecord = await Otp.findOne({ phone, otp });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ phone });
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        isVerified: true
      });
    } else {
      user.isVerified = true;
      await user.save();
    }

    // Clear OTPs
    await Otp.deleteMany({ phone });

    res.json({
      success: true,
      message: 'Login successful',
      user
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
