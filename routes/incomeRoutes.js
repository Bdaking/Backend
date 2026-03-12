const express = require("express");
const {
  addIncome,
  getAllIncome,
  deleteIncome,
  downloadincomeExcel,
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addIncome);
router.get("/get", protect, getAllIncome);
router.get("/downloadexcel", protect, downloadincomeExcel);
router.delete("/:id", protect, deleteIncome);

module.exports = router;
