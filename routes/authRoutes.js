const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getUserInfo,
} = require("../controllers/authController");

// Removed the upload middleware import

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect, getUserInfo);

// The router.post("/upload-image") block has been removed

module.exports = router;
