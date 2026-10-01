const express = require('express');
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/wishlist
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.json({ success: true, data: { products: [] } });
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
    return res.json({ success: true, data: wishlist || { products: [] } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/wishlist/toggle/:productId
router.post('/toggle/:productId', protect, async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Login required' });

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [req.params.productId] });
    } else {
      const idx = wishlist.products.indexOf(req.params.productId);
      if (idx > -1) wishlist.products.splice(idx, 1);
      else wishlist.products.push(req.params.productId);
      await wishlist.save();
    }

    return res.json({ success: true, message: 'Wishlist updated', data: wishlist });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
