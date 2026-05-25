const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  // Set required to false
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Note", noteSchema);
