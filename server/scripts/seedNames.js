if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Name = require("../models/Name");

const sampleNames = [
  "Olivia",
  "Liam",
  "Amara",
  "Noah",
  "Ada",
  "Kwame",
  "Sophia",
  "Mateo",
  "Zuri",
  "Aaliyah",
  "Ethan",
  "Mia",
  "Aria",
  "Kai",
  "Nia",
  "Ezra",
  "Ava",
  "Imani",
  "Kofi",
  "Sienna",
  "Lucas",
  "Amelie",
  "Zara",
  "Leo",
  "Maya",
  "Idris",
  "Aiden",
  "Layla",
  "Omar",
  "Hana",
  "Eliana",
  "Caleb",
  "Asha",
  "Jonah",
  "Esme",
  "Yusuf",
  "Isla",
  "Theo",
  "Amari",
  "Amaya",
  "Jasper",
  "Naima",
  "Aaron",
  "Elsie",
  "Malik",
  "Lila",
  "Nina",
  "Remi",
  "Felix",
  "Zahra",
];

const seedNames = async () => {
  console.log(process.env.MONGO_URI);
  return;
  try {
    await connectDB();
    const existingCount = await Name.countDocuments();

    if (existingCount > 0) {
      console.log(
        `Names collection already has ${existingCount} entries. Skipping seed.`
      );
      return;
    }

    const documents = sampleNames.map((name) => ({ name }));
    await Name.insertMany(documents);
    console.log(`Inserted ${documents.length} baby names.`);
  } catch (error) {
    console.error("Failed to seed names:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  seedNames()
    .then(() => {
      console.log("Name seed completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Name seed failed:", error);
      process.exit(1);
    });
}

module.exports = seedNames;
