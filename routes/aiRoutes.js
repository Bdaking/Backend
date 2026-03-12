const express = require("express");
const router = express.Router();
const { getFinancialSuggestions } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware"); // Assuming you have auth middleware

// This route handles the AI Request Frames
// POST /api/v1/ai/suggestions
router.post("/suggestions", protect, getFinancialSuggestions);

module.exports = router;
