const express = require("express");
const cors = require("cors");
const app = express();

const axios = require("axios");
const connectDB = require("./db/connect");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const imageDownloader = require("image-downloader");
const userRouter = require("./routes/User");
const notFoundMiddleware = require("./middleware/not-found");
const errorMiddleware = require("./middleware/error-handler.js");

app.use(express.json());
app.use(cookieParser());

// Serve static files from the correct path
app.use("/api/v1/ev/upload", express.static(__dirname + "/controller/uploads"));

// CORS configuration
app.use(
  cors({
    origin: "https://event-mint-cllient.vercel.app", // Allow requests from http://localhost:5173
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  })
);

// Define routes
app.use("/api/v1/ev", userRouter);

// Error Handling Middleware
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const serverUrl = `https://eventmint-server.onrender.com`;
app.get("*", async (req, res) => {
  res.send("chill");
});

const checkServerHealth = () => {
  axios
    .get(serverUrl)
    .then((response) => {
      console.log(`Server is healthy`, response.data);
    })
    .catch((error) => {
      console.error(`Error checking server health:`, error.message);
    });
};

checkServerHealth();

// Graceful shutdown
process.on("SIGINT", () => {
  mongoose.connection.close().then(() => {
    console.log("\nMongoDB disconnected through app termination");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8000;

const atlasConnectionUri = process.env.MONGO_URL;

const start = async () => {
  try {
    await connectDB(atlasConnectionUri);
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
