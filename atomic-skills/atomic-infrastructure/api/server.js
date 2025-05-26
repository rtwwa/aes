const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const skillsRoutes = require("./routes/skills");
const assessmentsRoutes = require("./routes/assessments");
const dashboardRoutes = require("./routes/dashboard");
const usersRoutes = require("./routes/users");
const testsRoutes = require("./routes/tests");
const certificatesRoutes = require("./routes/certificates");

dotenv.config();

const app = express();

// Настройка CORS
app.use(
  cors({
    origin: "http://localhost:8080", // Точный origin вместо wildcard
    credentials: true, // Разрешаем credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === "POST" && req.path === "/api/auth/login") {
    console.log("Login attempt body:", { email: req.body.email });
  }
  next();
});

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/atomic-skills",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/certificates", certificatesRoutes);

// Add body parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON parsing error:", err);
    return res.status(400).json({ error: "Invalid JSON" });
  }
  next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../../public")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/index.html"));
  });
}

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
