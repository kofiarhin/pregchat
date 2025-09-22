if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const http = require("http");
const createApp = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: /health`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
