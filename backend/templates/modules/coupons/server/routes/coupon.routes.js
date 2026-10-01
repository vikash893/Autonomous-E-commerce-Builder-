const express = require('express');
const Coupon = require('../models/Coupon');

const router = express.Router();

// POST /api/v1/coupons/apply
router.post('/apply', async (req, res, next) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive coupon code' });
    }

    if (orderAmount < coupon.minOrder) {
      return res.status(400).json({ success: false, error: `Minimum order amount of ${coupon.minOrder} required` });
    }

    const discountAmount =
      coupon.type === 'percentage'
        ? Math.round((orderAmount * coupon.discount) / 100)
        : Math.min(coupon.discount, orderAmount);

    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: { code: coupon.code, discountAmount, newTotal: Math.max(0, orderAmount - discountAmount) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
