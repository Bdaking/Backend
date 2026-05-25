const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");
const {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getReceipts,
  uploadReceipts,
  deleteReceipt,
  exportPDF,
} = require("../controllers/receiptController");

// ── Cloudinary storage (no local disk needed) ──────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === "application/pdf";
    return {
      folder: "receipts",
      resource_type: isPDF ? "raw" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
      // keeps original name readable in Cloudinary dashboard
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const ok =
    allowed.test(file.mimetype) ||
    allowed.test(file.originalname.split(".").pop().toLowerCase());
  ok ? cb(null, true) : cb(new Error("Only images and PDFs are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Folder routes
router.get("/folders", protect, getFolders);
router.post("/folders", protect, createFolder);
router.put("/folders/:id", protect, renameFolder);
router.delete("/folders/:id", protect, deleteFolder);

// Receipt routes
router.get("/", protect, getReceipts);
router.post("/upload", protect, upload.array("receipts", 20), uploadReceipts);
router.delete("/:id", protect, deleteReceipt);
router.post("/export-pdf", protect, exportPDF);

module.exports = router;
