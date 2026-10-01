const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/v1/search?q=cotton&category=Clothing&minPrice=100&maxPrice=1000
router.get('/', async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query);
    return res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
