const xlsx = require("xlsx");

const Income = require("../models/Income");

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    if (!source || amount == null || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: parsedDate,
    });

    await newIncome.save();
    res.status(201).json(newIncome);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Income Source
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId }).sort({
      date: 1,
      createdAt: 1,
    });
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Income Source
exports.deleteIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!income)
      return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Download Excel
exports.downloadincomeExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    const data = income.map((item) => ({
      Source: item.source ?? "Unknown",
      Amount: item.amount ?? 0,
      Date: item.date ? item.date.toLocaleDateString("en-US") : "N/A",
    }));

    // Add a blank row then a Total row at the bottom
    const totalAmount = data.reduce((sum, row) => sum + row.Amount, 0);
    data.push({ Source: "", Amount: "", Date: "" });
    data.push({ Source: "TOTAL", Amount: totalAmount, Date: "" });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Bold the Total row by setting cell styles
    const totalRowIndex = data.length; // 1-based: header=1, data rows, blank, total
    const totalAmountCell = `B${totalRowIndex + 1}`; // +1 for header row
    const totalLabelCell = `A${totalRowIndex + 1}`;

    if (!ws[totalLabelCell]) ws[totalLabelCell] = {};
    ws[totalLabelCell].s = { font: { bold: true } };

    if (!ws[totalAmountCell]) ws[totalAmountCell] = {};
    ws[totalAmountCell].s = { font: { bold: true } };

    // Set column widths for readability
    ws["!cols"] = [
      { wch: 20 }, // Source
      { wch: 12 }, // Amount
      { wch: 14 }, // Date
    ];

    xlsx.utils.book_append_sheet(wb, ws, "Income");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="income_details.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.send(buffer);
  } catch (error) {
    console.error("Download path error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
