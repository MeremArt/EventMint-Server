const {
  CustomAPIError,
  BadRequestError,
  UnauthenticatedError,
  ExistingUserError,
} = require("../error");
const { shopAddress } = require("./address");
const calculatePrice = require("./calculatePrice");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const Mint = require("../model/schema");
const Place = require("../model/Place");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const imageDownloader = require("image-downloader");
const { products } = require("./products");
const { WalletAdapterNetwork } = require("@solana/wallet-adapter-base");
const {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const multer = require(`multer`);
require("dotenv").config();
const fs = require("fs");
const { dirname } = require("path");
const sdk = require("api")("@underdog/v2.0#5vgec2olujb1d8j");

sdk.server("https://devnet.underdogprotocol.com");
sdk.auth("02c4d8566421ec.3588507468f641bda78b5c468fa49fdb");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new BadRequestError(
        "name, email, profession, and password are required fields."
      );
    }

    const existingUser = await Mint.findOne({ email });

    if (existingUser) {
      throw new ExistingUserError(
        "Email is already registered. Please sign in."
      );
    }

    const newUser = new Mint({ name, email, password });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Generate token

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Sign-up successful",
      token, // Include token in response
      newUser: { name: newUser.name },
    });
  } catch (error) {
    console.error("Error during sign-up:", error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }
};

const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Both email and password are required." });
    }

    // Find user by email
    const existingUser = await Mint.findOne({ email });

    // Check if user exists
    if (!existingUser) {
      return res.status(404).json({ error: "User not found. Please sign up." });
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    // Check if password is correct
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT token
    const token = existingUser.createJWT();

    // Send token in cookie and response
    res.cookie("token", token, { httpOnly: true, secure: true }).json({
      success: true,
      message: "Sign-in successful",
      token: token,
    });
  } catch (error) {
    console.error("Error during sign-in:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const logout = async (req, res) => {
  res.cookie("token", "").json(true);
  console.log("User logged out successfully");
};
const getUserData = async (req, res) => {
  try {
    // Extract the token from the cookies
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use the decoded user ID to fetch user data
    const user = await Mint.findById(decoded.userId);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Return the user's data
    res
      .status(StatusCodes.OK)
      .json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Invalid token" });
    }
    console.error("Failed to fetch user data:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch user data" });
  }
};

const getUploads = async (req, res) => {
  try {
    const { link } = req.body;
    const newName = `${Date.now()}.jpg`; // Adjusted the concatenation of the file name
    const uploadDirectory = __dirname + `/uploads/`;

    // Check if the upload directory exists, if not, create it
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }

    // Download the image from the provided link and save it to the server's upload directory
    await imageDownloader.image({
      url: link,
      dest: uploadDirectory + newName,
    });

    const imagePath = uploadDirectory + newName;

    // Send the path to the uploaded image along with the image itself in the response
    res.json({ imagePath, imageName: newName });

    console.log(`Image downloaded successfully.`);
  } catch (error) {
    console.error("Error downloading image:", error.message);
    res.status(500).json({ error: "Error downloading image" });
  }
};

const test = async (req, res) => {
  res.json("Hello World");
  console.log("proven");
};

const addPhotoByLink = async (req, res) => {
  console.log(`Started.`);
  const { link } = req.body;
  const newName = `photos` + Date.now() + ".jpg"; // Corrected file extension
  const uploadDirectory = __dirname + "/uploads/";

  try {
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }

    await imageDownloader.image({
      url: link,
      dest: uploadDirectory + newName,
    });

    console.log(`Image downloaded successfully.`);
    res.json(newName);
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).json({ error: "Failed to download image." });
  }
};

const uploadPhotoFile = (req, res) => {
  const uploadedFile = [];

  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + `.` + ext;
    fs.renameSync(path, newPath);
    uploadedFile.push(newPath.replace(`controller/uploads/`, ``));
  }

  res.json(uploadedFile);
  console.log(req.files);
};

const uploadPlaces = async (req, res) => {
  const { token } = req.cookies;
  try {
    const {
      title,
      address,
      photos: addedPhotos,
      description,
      price,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    } = req.body;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  } catch (error) {
    console.error("Error creating place:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the place." });
  }
};
const grabUser = (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, userData) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      const { id } = userData;
      const userPlaces = await Place.find({ owner: id });
      res.json(userPlaces);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
};

const grabId = async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
};

const updatePlace = async (req, res) => {
  try {
    const { token } = req.cookies;
    const {
      id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    } = req.body;

    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const placeDoc = await Place.findById(id);

    // Check if placeDoc is null (no place found with the provided id)
    if (!placeDoc) {
      return res.status(404).json({ error: "Place not found" });
    }

    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const IndexPage = async (req, res) => {
  res.json(await Place.find());
};

const uploadFile = (req, res) => {
  const uploadedFile = [];

  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + `.` + ext;
    fs.renameSync(path, newPath);
    uploadedFile.push(newPath.replace(`controller/uploads/`, ``));
  }

  res.json(uploadedFile);
};

const makeTransaction = async (req, res) => {
  try {
    // We pass the selected items in the query, calculate the expected cost
    const amount = calculatePrice(req.query);
    if (amount.toNumber() === 0) {
      res.status(400).json({ error: "Can't checkout with charge of 0" });
      return;
    }

    // We pass the reference to use in the query
    const { reference } = req.query;
    if (!reference) {
      res.status(400).json({ error: "No reference provided" });
      return;
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body;
    if (!account) {
      res.status(400).json({ error: "No account provided" });
      return;
    }
    const buyerPublicKey = new PublicKey(account);
    const shopPublicKey = shopAddress;

    const network = WalletAdapterNetwork.Devnet;
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint);

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await connection.getLatestBlockhash("finalized");

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: buyerPublicKey,
    });

    // Create the instruction to send SOL from the buyer to the shop
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: buyerPublicKey,
      lamports: amount * 1000000000, // Lamports in SOL
      toPubkey: shopPublicKey,
    });

    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    });

    // Add the instruction to the transaction
    transaction.add(transferInstruction);

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false,
    });
    const base64 = Buffer.from(serializedTransaction).toString("base64");

    // Insert into database: reference, amount

    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message: "Thanks for your order! 🍪",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error creating transaction" });
  }
};

const mintNFT = async (req, res) => {
  try {
    const { pubkey } = req.body;
    console.log(pubkey);
    const { data } = await sdk.postV2ProjectsProjectidNfts(
      {
        receiverAddress: pubkey,
        name: "EventMint",
        symbol: "EMT",
        description: "Experience the future of event ticketing with EventMint",
        image:
          "https://res.cloudinary.com/dtfvdjvyr/image/upload/v1712185878/Eventmint2_lqalw1.png",
      },
      { projectId: "1" }
    );
    res.status(200).json({
      message: "Thanks for your order!",
    });
    console.log(data);
  } catch (err) {
    res.status(500).json({ error: "error creating NFT" });
    console.error(err);
  }
};

module.exports = {
  register,
  logIn,
  getUserData,
  logout,
  getUploads,
  test,
  addPhotoByLink,
  mintNFT,
  uploadPlaces,
  grabUser,
  grabId,
  updatePlace,
  IndexPage,
  uploadPhotoFile,
  uploadFile,
  makeTransaction,
};
