const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Correctly references the User model
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // This is cleaner than manual createdAt
  },
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
