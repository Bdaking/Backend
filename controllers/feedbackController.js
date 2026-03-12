const Feedback = require("../models/Feedback");

// @desc    Submit new feedback
exports.addFeedback = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    let feedback = await Feedback.create({
      user: req.user.id,
      rating,
      comment,
    });

    // FIX: Removed the comma between "fullName" and "email"
    feedback = await feedback.populate("user", "fullName email");

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    // This will stop the "Internal Server Error"
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "fullName email") // This is the "Identity" bridge
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
