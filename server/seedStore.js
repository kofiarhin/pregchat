if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Item = require("./models/Item");

const sampleItems = [
  {
    name: "Prenatal Vitamins",
    description: "Daily supplement formulated to support pregnancy health.",
    price: 24.99,
    stock: 120,
    image: "https://via.placeholder.com/400x300?text=Prenatal+Vitamins",
  },
  {
    name: "Pregnancy Pillow",
    description: "Full body pillow that supports hips, back, and belly for restful sleep.",
    price: 69.99,
    stock: 45,
    image: "https://via.placeholder.com/400x300?text=Pregnancy+Pillow",
  },
  {
    name: "Nursing Bra",
    description: "Soft, adjustable maternity bra designed for nursing comfort.",
    price: 32.0,
    stock: 80,
    image: "https://via.placeholder.com/400x300?text=Nursing+Bra",
  },
  {
    name: "Baby Stroller",
    description: "Lightweight stroller with smooth suspension ideal for newborns.",
    price: 249.99,
    stock: 25,
    image: "https://via.placeholder.com/400x300?text=Baby+Stroller",
  },
  {
    name: "Baby Carrier",
    description: "Ergonomic carrier supporting newborn to toddler with breathable fabric.",
    price: 129.99,
    stock: 60,
    image: "https://via.placeholder.com/400x300?text=Baby+Carrier",
  },
  {
    name: "Diaper Pack",
    description: "Eco-friendly disposable diapers with leak protection for day and night.",
    price: 39.99,
    stock: 200,
    image: "https://via.placeholder.com/400x300?text=Diaper+Pack",
  },
  {
    name: "Baby Wipes",
    description: "Fragrance-free wipes gentle on newborn skin with aloe and chamomile.",
    price: 14.5,
    stock: 180,
    image: "https://via.placeholder.com/400x300?text=Baby+Wipes",
  },
  {
    name: "Baby Monitor",
    description: "Audio/video monitor with night vision and two-way talk for peace of mind.",
    price: 159.99,
    stock: 30,
    image: "https://via.placeholder.com/400x300?text=Baby+Monitor",
  },
  {
    name: "Stretch Mark Cream",
    description: "Moisturizing cream rich in shea butter to nourish stretching skin.",
    price: 22.75,
    stock: 95,
    image: "https://via.placeholder.com/400x300?text=Stretch+Mark+Cream",
  },
  {
    name: "Swaddle Blanket Set",
    description: "Set of breathable cotton swaddles to keep baby snug and secure.",
    price: 28.99,
    stock: 110,
    image: "https://via.placeholder.com/400x300?text=Swaddle+Blanket+Set",
  },
];

const seedStore = async () => {
  try {
    await connectDB();
    const count = await Item.countDocuments();

    if (count > 0) {
      console.log(`Store already has ${count} items. Skipping seed.`);
      return;
    }

    await Item.insertMany(sampleItems);
    console.log(`Inserted ${sampleItems.length} store items.`);
  } catch (error) {
    console.error("Failed to seed store:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  seedStore()
    .then(() => {
      console.log("Store seed completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Store seed failed:", error);
      process.exit(1);
    });
}

module.exports = seedStore;
