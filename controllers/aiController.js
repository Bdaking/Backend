const { GoogleGenerativeAI } = require("@google/generative-ai");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getFinancialSuggestions = async (req, res) => {
  try {
    const userId = req.user.id; // Get ID from the 'protect' middleware

    // 1. Fetch ALL data frames for this user
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }),
      Expense.find({ userId }).sort({ date: -1 }),
    ]);

    // 2. Calculate Totals for the "Context Header"
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Build a high-density prompt
    const prompt = `
      Context: User Mala. Current Year: 2026.
      
      Total Income: ₹${totalIncome}
      Total Expenses: ₹${totalExpense}
      
      Detailed Income Sources: ${JSON.stringify(incomes.map((i) => ({ s: i.source, a: i.amount })))}
      Detailed Expense Categories: ${JSON.stringify(expenses.map((e) => ({ c: e.category, a: e.amount })))}
      
      Task: Based on these detailed streams, identify 2 hidden spending trends and 1 specific way to increase the savings ratio. Max 50 words total.
    `;

    const result = await model.generateContent(prompt);
    res.json({ suggestions: result.response.text() });
  } catch (error) {
    console.error("Aggregation Error:", error.message);
    res.status(500).json({ error: "AI Signal Lost", details: error.message });
  }
};
