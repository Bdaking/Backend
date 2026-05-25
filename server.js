const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDb = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const aiChatRoutes = require("./routes/aiChatRoutes");
const receiptRoutes = require("./routes/receiptRoutes");

// Import Note Controller
const {
  addNote,
  getAllNotes,
  deleteNote,
} = require("./controllers/noteController");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Initialize Database
connectDb();

// Main Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/ai", require("./routes/aiChatRoutes"));

// Notes Routes
app.post("/add-note", addNote);
app.get("/get-all-notes", getAllNotes);
app.delete("/delete-note/:id", deleteNote);

// Static Uploads Route
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/receipts", receiptRoutes);

// --- VERCEL DEPLOYMENT FIXES ---

// Only run app.listen() locally (when not on Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

// Export the app for Vercel's serverless handler
module.exports = app;
