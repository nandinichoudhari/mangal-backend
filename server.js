require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');

const authRoutes = require('./routes/auth');

const app = express(); // ✅ app MUST be defined before routes

// Middleware
app.use(cors());
app.use(express.json());

// OTP routes
app.use('/api', require('./routes/otp'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// Razorpay
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Other routes
app.use('/api/auth', authRoutes);

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, phone } = req.body;

    const order = await rzp.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `mangal_${Date.now()}`,
      notes: { customer_phone: phone }
    });

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_signature, order_id, razorpay_payment_id, phone } = req.body;
    const crypto = require('crypto');
    const User = require('./models/User');

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await User.findOneAndUpdate(
        { phone },
        {
          $push: {
            orders: {
              items: JSON.parse(req.body.items || '[]'),
              total: parseFloat(req.body.total),
              paymentMethod: 'razorpay',
              timestamp: new Date()
            }
          }
        }
      );

      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root route (optional, for browser check)
app.get('/', (req, res) => {
  res.send('Mangal backend is running 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mangal Backend running on port ${PORT}`);
});
