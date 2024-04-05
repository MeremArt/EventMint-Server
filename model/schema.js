const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const EMSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Must provide a name."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Must provide an email."],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      unique: true,
    },

    password: {
      type: String,
      required: [true, "Must provide a password."],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre middleware to hash password
EMSchema.pre("save", async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
EMSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    return false;
  }
};

// Method to create JWT
EMSchema.methods.createJWT = function () {
  const currentTime = new Date();
  const expirationTime = new Date(currentTime);
  expirationTime.setMinutes(expirationTime.getMinutes() + 15); // Extend token expiration time

  return jwt.sign(
    {
      userId: this._id,
      name: this.name,
      email: this.email,
      exp: parseInt(expirationTime.getTime() / 1000), // Expiration time in seconds
    },
    process.env.JWT_SECRET
  );
};

// Create model
const Mint = mongoose.model("Mint", EMSchema);

module.exports = Mint;
