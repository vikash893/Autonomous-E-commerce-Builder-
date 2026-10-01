const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

const getUserId = (req) => {
  return req.user?.userId || req.user?.id || req.user?._id;
};


// GET /api/v1/cart
// Get current user's cart
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.json({
        success: true,
        data: { items: [] }
      });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    return res.json({
      success: true,
      data: cart || { items: [] }
    });

  } catch (err) {
    next(err);
  }
});


// POST /api/v1/cart/add
// Add product to cart
router.post('/add', async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const quantity = Number(qty);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive integer'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Optional stock validation
    if (
      product.stock !== undefined &&
      quantity > product.stock
    ) {
      return res.status(400).json({
        success: false,
        error: 'Requested quantity exceeds available stock'
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [
          {
            product: productId,
            qty: quantity
          }
        ]
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        const newQty = existingItem.qty + quantity;

        if (
          product.stock !== undefined &&
          newQty > product.stock
        ) {
          return res.status(400).json({
            success: false,
            error: 'Requested quantity exceeds available stock'
          });
        }

        existingItem.qty = newQty;
      } else {
        cart.items.push({
          product: productId,
          qty: quantity
        });
      }

      await cart.save();
    }

    await cart.populate('items.product');

    return res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });

  } catch (err) {
    next(err);
  }
});


// DELETE /api/v1/cart/item/:productId
// Remove product from cart
router.delete('/item/:productId', async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== req.params.productId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in cart'
      });
    }

    await cart.save();

    await cart.populate('items.product');

    return res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });

  } catch (err) {
    next(err);
  }
});


module.exports = router;