const express = require("express");
const router = express.Router();
const multer = require("multer");
const PhotoMiddleware = require(`../middleware/photoMiddleware`);
const verifyToken = require(`../middleware/authenticateToken`);
const {
  register,
  logIn,
  getUserData,
  logout,
  uploadPlaces,
  addPhotoByLink,
  test,
  uploadPhotoFile,
  grabUser,
  grabId,
  updatePlace,
  IndexPage,
  uploadFile,
  makeTransaction,
  mintNFT,
} = require(`../controller/User`);

// Route for register
router.post("/register", register);
// Route for login
router.post("/login", logIn);

router.post("/logout", verifyToken, logout);

router.get("/user", verifyToken, getUserData);

router.post("/upload-by-link", addPhotoByLink);
// Configure multer to save uploaded files to the "controller/uploads/" directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "controller/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // You might want to generate a unique filename here
  },
});

router.post(
  "/upload-file",
  PhotoMiddleware.array(`photos`, 100),
  uploadPhotoFile
);

router.post("/upload-it", PhotoMiddleware.array("photos", 100), uploadFile);
router.post("/upload-place", uploadPlaces);

router.get("/test", test);

router.get("/user-event", grabUser);

router.get("/event/:id", grabId);

router.put("/update-place", updatePlace);

router.get("/place", IndexPage);

router.post("/solanaPay", makeTransaction);

router.post("/getNFT", mintNFT);

module.exports = router;
