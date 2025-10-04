const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const connectDB = require("../../config/db");

let mongoServer;
process.env.SKIP_INTEGRATION_TESTS = "true";

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.3" },
    });
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = "integration-secret";
    await connectDB();
    process.env.SKIP_INTEGRATION_TESTS = "false";
  } catch (error) {
    console.warn("MongoMemoryServer unavailable, skipping integration tests", error.message);
  }
});

afterEach(async () => {
  if (process.env.SKIP_INTEGRATION_TESTS === "true") {
    return;
  }

  const { connection } = mongoose;
  const collections = await connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (process.env.SKIP_INTEGRATION_TESTS === "true") {
    return;
  }

  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
