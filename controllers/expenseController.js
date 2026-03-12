const xlsx = require("xlsx");

const Expense = require("../models/Expense");

// Add Expense Source
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    // Validation
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
    await Expense.findByIdAndDelete(req.params.id);
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
      Category: item.category,
      Amount: item.amount,
      Date: item.date.toLocaleDateString(), // Better formatting for the receiver
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Expenses");

    // FIX: Generate a Buffer instead of writing to disk
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers to define the payload type
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="expense_details.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    // Transmit the buffer directly
    res.send(buffer);
  } catch (error) {
    console.error("Download path error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
