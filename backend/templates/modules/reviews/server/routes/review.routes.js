const express = require('express');
const Review = require('../models/Review');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/reviews/product/:productId
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    return res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/reviews/product/:productId
router.post('/product/:productId', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({
      user: req.user?.userId || undefined,
      product: req.params.productId,
      rating: Number(rating) || 5,
      comment,
    });
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
