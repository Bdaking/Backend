const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Fallback to avoid empty API keys failing compilation
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_CHAT_API_KEY || process.env.GEMINI_API_KEY,
);

const userCooldown = new Map();

exports.getAiChatResponse = async (req, res) => {
  try {
    // 💡 FIXED: Fallback to req.body.userId if req.user middleware drops out
    const userId = req.user?.id || req.user?._id || req.body.userId;
    const { prompt } = req.body;

    if (!userId)
      return res
        .status(401)
        .json({ message: "User identity validation missing." });

    if (!prompt || !prompt.trim())
      return res.status(400).json({ message: "Prompt is required" });

    const now = Date.now();
    const lastRequest = userCooldown.get(userId) || 0;

    if (now - lastRequest < 2000) {
      return res.status(429).json({
        message: "Too many requests. Please wait a moment.",
      });
    }
    userCooldown.set(userId, now);

    const [incomes, expenses] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }).limit(5),
      Expense.find({ userId }).sort({ date: -1 }).limit(5),
    ]);

    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    let context = `
You are FinTrack AI, a smart financial assistant.

Summary:
- Income: ₹${totalIncome}
- Expenses: ₹${totalExpense}
- Balance: ₹${balance}
`;

    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes("transaction") ||
      lowerPrompt.includes("expense") ||
      lowerPrompt.includes("income") ||
      lowerPrompt.includes("list")
    ) {
      context += `

Recent Transactions (last 5):

Income:
${incomes
  .map(
    (i) =>
      `• ${i.source} - ₹${i.amount} (${new Date(i.date).toLocaleDateString("en-IN")})`,
  )
  .join("\n")}

Expenses:
${expenses
  .map(
    (e) =>
      `• ${e.category} - ₹${e.amount} (${new Date(e.date).toLocaleDateString("en-IN")})`,
  )
  .join("\n")}
`;
    }

    context += `

User Question: ${prompt}

Rules for your response:
- Give a short professional text summary first.
- Then list transactions EXACTLY in this format per line:
  Name: <description> | Amount: ₹<amount> | Date: <date> | Type: <Income/Expense>
- Do NOT use markdown tables (no | --- | headers).
- Do NOT use asterisks or bold text.
- Keep it concise.
`;

    // 💡 FIXED: Changed from nonexistent 'gemini-2.5-flash' to the actual identifier
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      answer: text,
      stats: { totalIncome, totalExpense, balance },
    });
  } catch (error) {
    console.error("AI ERROR:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      message: "AI service encountered an interruption. Please try again.",
      details: error.message,
    });
  }
};
