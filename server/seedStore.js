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
    image:
      "https://images.ctfassets.net/uuc5ok478nyh/3V1w3Isui8AiIGAs48qjYT/ba8f8e8813bf7b8abe58612b52390c5b/PDP_EPRE_Bottle_No_Scent__1_.jpg?w=800&h=800&fl=progressive&q=90&fm=jpg",
  },
  {
    name: "Pregnancy Pillow",
    description:
      "Full body pillow that supports hips, back, and belly for restful sleep.",
    price: 69.99,
    stock: 45,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_7ac3bf3a-1696-4d8a-b8f0-25389179de69?wid=800&hei=800&fmt=pjpeg",
  },
  {
    name: "Nursing Bra",
    description: "Soft, adjustable maternity bra designed for nursing comfort.",
    price: 32.0,
    stock: 80,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_3149feb0-4727-49ed-897c-56627be850d6?wid=800&hei=800&fmt=pjpeg",
  },
  {
    name: "Baby Stroller",
    description:
      "Lightweight stroller with smooth suspension ideal for newborns.",
    price: 249.99,
    stock: 25,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_62f4047d-9786-4838-be61-630ae1cf492b?wid=800&hei=800&fmt=pjpeg",
  },
  {
    name: "Baby Carrier",
    description:
      "Ergonomic carrier supporting newborn to toddler with breathable fabric.",
    price: 129.99,
    stock: 60,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_f923bb1f-8c41-411e-89ab-28fea78978d1?wid=800&hei=800&fmt=pjpeg",
  },
  {
    name: "Diaper Pack",
    description:
      "Eco-friendly disposable diapers with leak protection for day and night.",
    price: 39.99,
    stock: 200,
    // Using an Amazon-hosted image to avoid cross-domain issues. This URL was tested and loads correctly.
    image: "https://m.media-amazon.com/images/I/41XdesYTkyL._UL320_.jpg",
  },
  {
    name: "Baby Wipes",
    description:
      "Fragrance-free wipes gentle on newborn skin with aloe and chamomile.",
    price: 14.5,
    stock: 180,
    // Using an Amazon-hosted image of Pampers sensitive wipes for reliable loading.
    image: "https://m.media-amazon.com/images/I/71QhuGLEDML._SL1500_.jpg",
  },
  {
    name: "Baby Monitor",
    description:
      "Audio/video monitor with night vision and two-way talk for peace of mind.",
    price: 159.99,
    stock: 30,
    // Updated to a dependable Amazon-hosted image of an ebemate baby monitor.
    image: "https://m.media-amazon.com/images/I/613Zcww3XKL.jpg",
  },
  {
    name: "Stretch Mark Cream",
    description:
      "Moisturizing cream rich in shea butter to nourish stretching skin.",
    price: 22.75,
    stock: 95,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_7648da65-ac6e-4243-aeea-40418833a5ea?wid=800&hei=800&fmt=pjpeg",
  },
  {
    name: "Swaddle Blanket Set",
    description:
      "Set of breathable cotton swaddles to keep baby snug and secure.",
    price: 28.99,
    stock: 110,
    image:
      "https://target.scene7.com/is/image/Target/GUEST_ba6f4f35-ad9e-44d9-a861-19b98579386f?wid=800&hei=800&fmt=pjpeg",
  },
];

const seedStore = async () => {
  try {
    await connectDB();
    // Remove any existing items so that the seed always reflects the current data
    console.log("Clearing existing store items...");
    await Item.deleteMany({});
    console.log("Existing items deleted. Inserting fresh sample data...");
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
