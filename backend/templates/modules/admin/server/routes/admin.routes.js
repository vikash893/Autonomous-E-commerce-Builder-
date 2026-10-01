const express = require('express');
const Product = require('../models/Product');
let Order = null;
try {
  Order = require('../models/Order');
} catch {}

const router = express.Router();

// GET /api/v1/admin/stats - Comprehensive store statistics for admin dashboard
router.get('/stats', async (req, res, next) => {
  try {
    const productsCount = await Product.countDocuments().catch(() => 0);
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 5 } }).catch(() => 0);

    let ordersCount = 0;
    let totalRevenue = 0;
    let pendingOrdersCount = 0;
    let recentOrders = [];

    if (Order) {
      ordersCount = await Order.countDocuments().catch(() => 0);
      pendingOrdersCount = await Order.countDocuments({ status: 'PENDING' }).catch(() => 0);

      const allOrders = await Order.find().sort({ createdAt: -1 }).limit(10).catch(() => []);
      recentOrders = allOrders;

      // Calculate total revenue
      const revenueAggr = await Order.aggregate([
        { $match: { paymentStatus: { $ne: 'FAILED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).catch(() => []);
      totalRevenue = revenueAggr[0]?.total || 0;
    }

    const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(5).catch(() => []);

    return res.json({
      success: true,
      data: {
        productsCount,
        ordersCount,
        totalRevenue,
        lowStockCount,
        pendingOrdersCount,
        recentOrders,
        recentProducts
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
