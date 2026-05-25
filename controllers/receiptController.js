const Receipt = require("../models/Receipt");
const ReceiptFolder = require("../models/ReceiptFolder");
const cloudinary = require("../config/cloudinary");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// ─── helper: delete one receipt from Cloudinary + DB ────────────
async function destroyReceipt(receipt) {
  try {
    const isPDF = receipt.mimetype === "application/pdf";
    await cloudinary.uploader.destroy(receipt.cloudinaryPublicId, {
      resource_type: isPDF ? "raw" : "image",
    });
  } catch (e) {
    console.error("Cloudinary destroy error:", e.message);
  }
  await receipt.deleteOne();
}

// ─── FOLDERS ─────────────────────────────────────────────────────

exports.getFolders = async (req, res) => {
  try {
    const folders = await ReceiptFolder.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: folders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Folder name is required" });
    const folder = await ReceiptFolder.create({ user: req.user.id, name });
    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Folder name is required" });
    const folder = await ReceiptFolder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name },
      { new: true },
    );
    if (!folder)
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });
    res.json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folder = await ReceiptFolder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!folder)
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });

    const receipts = await Receipt.find({
      folder: folder._id,
      user: req.user.id,
    });
    await Promise.all(receipts.map(destroyReceipt));

    await folder.deleteOne();
    res.json({ success: true, message: "Folder deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RECEIPTS ─────────────────────────────────────────────────────

exports.getReceipts = async (req, res) => {
  try {
    const { folderId, sort } = req.query;
    const query = { user: req.user.id };
    if (folderId) query.folder = folderId;

    const receipts = await Receipt.find(query).sort({
      uploadedAt: sort === "asc" ? 1 : -1,
    });
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadReceipts = async (req, res) => {
  try {
    const { folderId } = req.body;
    if (!req.files || !req.files.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });

    const receipts = await Promise.all(
      req.files.map((file) =>
        Receipt.create({
          user: req.user.id,
          folder: folderId || null,
          cloudinaryPublicId: file.filename,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: file.path,
        }),
      ),
    );
    res.status(201).json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!receipt)
      return res
        .status(404)
        .json({ success: false, message: "Receipt not found" });

    await destroyReceipt(receipt);
    res.json({ success: true, message: "Receipt deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/receipts/export-pdf
exports.exportPDF = async (req, res) => {
  try {
    const { receiptIds } = req.body;
    if (!receiptIds || !receiptIds.length)
      return res
        .status(400)
        .json({ success: false, message: "No receipts selected" });

    const receipts = await Receipt.find({
      _id: { $in: receiptIds },
      user: req.user.id,
    });

    const doc = new PDFDocument({ autoFirstPage: false, margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=receipts.pdf");
    doc.pipe(res);

    for (const receipt of receipts) {
      const isPDF = receipt.mimetype === "application/pdf";
      doc.addPage();

      if (isPDF) {
        doc
          .fillColor("blue")
          .text(receipt.url, { align: "center", link: receipt.url });
      } else {
        try {
          const { data: imgBuffer } = await axios.get(receipt.url, {
            responseType: "arraybuffer",
          });
          const pageWidth = doc.page.width - 60;
          doc.image(imgBuffer, 30, doc.y, {
            fit: [pageWidth, doc.page.height - 60],
            align: "center",
          });
        } catch {
          doc
            .fillColor("red")
            .text("(Could not render image)", { align: "center" });
        }
      }
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
