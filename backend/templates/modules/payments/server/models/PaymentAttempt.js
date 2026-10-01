const mongoose = require('mongoose');

const paymentAttemptSchema = new mongoose.Schema(
  {
    gatewayOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['CREATED', 'PAID'], default: 'CREATED' },
    orderData: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      customerName: { type: String, required: true },
      customerEmail: { type: String, required: true },
      shippingAddress: { type: String, required: true },
      items: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          name: String,
          price: Number,
          qty: Number,
        },
      ],
      totalAmount: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);