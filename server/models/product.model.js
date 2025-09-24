const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GBP' },
    brand: { type: String, default: 'Generic' },
    category: { type: String, default: 'essentials' },
    images: [{ type: String }],
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 4.7, min: 0, max: 5 },
    tags: [{ type: String }],
    recommendedWeek: { type: Number, min: 0, max: 42 },
    url: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
