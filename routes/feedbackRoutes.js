const express = require("express");
const {
  addFeedback,
  getAllFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware"); // Use your existing auth middleware

const router = express.Router();

// You want users to be logged in to leave feedback
router.route("/").post(protect, addFeedback).get(protect, getAllFeedback);

module.exports = router;
