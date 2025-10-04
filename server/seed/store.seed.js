require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const data = require('./store.data');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pregchat';
    await mongoose.connect(uri, { dbName: uri.split('/').pop() });
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(data);
      console.log(`Seeded ${data.length} products`);
    } else {
      console.log(`Skipping seed. Products already present: ${count}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
