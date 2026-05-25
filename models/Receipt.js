const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReceiptFolder",
      default: null,
    },
    // ── Cloudinary ──────────────────────────────────────────────
    cloudinaryPublicId: {
      type: String,
      required: true, // needed to delete from Cloudinary
    },
    // ────────────────────────────────────────────────────────────
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true }, // full Cloudinary URL
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Receipt", receiptSchema);
