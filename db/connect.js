const mongoose = require("mongoose");

const connectDB = async (url) => {
  try {
    await mongoose.connect(url);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if unable to connect
  }
};

module.exports = connectDB;
