const xlsx = require("xlsx");

const Income = require("../models/Income");

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    // Validation
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
    // FIX: Sort by date, then by creation time to ensure stable 'Time Slots'
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
    await Income.findByIdAndDelete(req.params.id);
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

    // Prepare data for excel
    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");
    xlsx.writeFile(wb, "income_details.xlsx");
    res.download("income_details.xlsx");
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
