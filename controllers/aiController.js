const { GoogleGenerativeAI } = require("@google/generative-ai");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getFinancialSuggestions = async (req, res) => {
  try {
    // ── 1. Validate userId ────────────────────────────────────────────────
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId. Please log in again.",
      });
    }

    // ── 2. Validate Gemini API key early — fail fast ──────────────────────
    if (!process.env.GEMINI_API_KEY) {
      console.error("[AI] GEMINI_API_KEY is not set in environment variables.");
      return res.status(500).json({
        error: "Server misconfiguration: missing AI API key.",
      });
    }

    // ── 3. Fetch live data from DB ────────────────────────────────────────
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }).limit(20).lean(),
      Expense.find({ userId }).sort({ date: -1 }).limit(20).lean(),
    ]);

    const totalIncome = incomes.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    const totalExpense = expenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );
    const balance = totalIncome - totalExpense;

    // ── 4. Build prompt ───────────────────────────────────────────────────
    const incomeStr = incomes
      .slice(0, 6)
      .map((i) => `${i.source || i.category || "Income"}: ₹${i.amount}`)
      .join(", ");

    const expenseStr = expenses
      .slice(0, 6)
      .map((e) => `${e.category || "Expense"}: ₹${e.amount}`)
      .join(", ");

    const prompt = `You are a concise personal finance advisor for an Indian user.

Financial snapshot (Current Year: 2026):
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpense}
- Balance: ₹${balance}
- Recent income sources: ${incomeStr || "N/A"}
- Recent expense categories: ${expenseStr || "N/A"}

Task: Identify 2 hidden spending trends and 1 specific way to boost savings ratio.
Reply in plain text only, max 55 words, no markdown, no bullet symbols.`;

    // ── 5. Call Gemini ────────────────────────────────────────────────────
    //  FIX: use the correct stable model name — "gemini-2.5-flash" does not
    //  exist; the correct identifiers are "gemini-1.5-flash" (stable) or
    //  "gemini-2.0-flash" (latest stable as of 2025).
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.()?.trim();

    if (!text) {
      throw new Error("Empty response from Gemini.");
    }

    return res.json({ suggestions: text });
  } catch (error) {
    // Surface a clear, actionable error message in the logs
    console.error("[AI] getFinancialSuggestions error:", error.message);

    // Gemini quota / rate-limit errors surface as 429 inside the SDK message
    if (
      error.message?.includes("429") ||
      error.message?.toLowerCase().includes("quota")
    ) {
      return res.status(429).json({
        error: "AI quota exceeded. Try again tomorrow.",
      });
    }

    // Model-not-found errors (what caused the original 500)
    if (
      error.message?.toLowerCase().includes("not found") ||
      error.message?.toLowerCase().includes("invalid model")
    ) {
      return res.status(500).json({
        error: "Invalid AI model name. Check server configuration.",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "AI signal lost. Please try again later.",
      details: error.message,
    });
  }
};
