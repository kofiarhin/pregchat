const express = require('express');
const DailyContent = require('../models/DailyContent');
const Product = require('../models/product.model');

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.get(
  '/daily',
  asyncHandler(async (req, res) => {
    const items = await DailyContent.find().sort({ day: 1 }).lean();
    return res.json({ items });
  })
);

router.post(
  '/daily',
  asyncHandler(async (req, res) => {
    const created = await DailyContent.create(req.body);
    return res.status(201).json(created);
  })
);

router.put(
  '/daily/:id',
  asyncHandler(async (req, res) => {
    const updated = await DailyContent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Daily content not found' });
    }
    return res.json(updated);
  })
);

router.delete(
  '/daily/:id',
  asyncHandler(async (req, res) => {
    const deleted = await DailyContent.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Daily content not found' });
    }
    return res.status(204).end();
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const items = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ items });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const created = await Product.create(req.body);
    return res.status(201).json(created);
  })
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  })
);

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(updated);
  })
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(204).end();
  })
);

module.exports = router;
