const express = require("express");
const router = express.Router();
const { getAiChatResponse } = require("../controllers/aiChatController");
// Import your protect middleware
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, getAiChatResponse);

module.exports = router;
