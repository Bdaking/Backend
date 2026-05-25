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

connectDb();

// Static Files (declared once, before routes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Main Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/ai-chat", aiChatRoutes); // fixed: was /api/ai, now consistent prefix
app.use("/api/receipts", receiptRoutes);

// Notes Routes (prefixed consistently)
app.post("/api/v1/notes/add", addNote);
app.get("/api/v1/notes", getAllNotes);
app.delete("/api/v1/notes/:id", deleteNote);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
