const xlsx = require("xlsx");

const Expense = require("../models/Expense");

// Add Expense Source
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    if (!category || amount == null || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category,
      amount,
      date: parsedDate,
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Expense Source
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Expense Source
exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!expense)
      return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Download Excel
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    const data = expense.map((item) => ({
      Category: item.category ?? "Unknown",
      Amount: item.amount ?? 0,
      Date: item.date ? item.date.toLocaleDateString("en-US") : "N/A",
    }));

    // Add a blank row then a Total row at the bottom
    const totalAmount = data.reduce((sum, row) => sum + row.Amount, 0);
    data.push({ Category: "", Amount: "", Date: "" });
    data.push({ Category: "TOTAL", Amount: totalAmount, Date: "" });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Bold the Total row cells
    const totalRowIndex = data.length;
    const totalAmountCell = `B${totalRowIndex + 1}`; // +1 for header row
    const totalLabelCell = `A${totalRowIndex + 1}`;

    if (!ws[totalLabelCell]) ws[totalLabelCell] = {};
    ws[totalLabelCell].s = { font: { bold: true } };

    if (!ws[totalAmountCell]) ws[totalAmountCell] = {};
    ws[totalAmountCell].s = { font: { bold: true } };

    // Set column widths for readability
    ws["!cols"] = [
      { wch: 20 }, // Category
      { wch: 12 }, // Amount
      { wch: 14 }, // Date
    ];

    xlsx.utils.book_append_sheet(wb, ws, "Expenses");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="expense_details.xlsx"',
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
