const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },

  name: String,

  address: {
    address1: String,
    address2: String,
    city: String,
    phone: String
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  orders: [{
    items: Array,
    total: Number,
    timestamp: Date,
    paymentMethod: String,
    status: { type: String, default: 'pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
