const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../../database/models/User");
const { auth } = require("../../middleware/auth");
const config = require("../../config");

const router = express.Router();

// Validation middleware
const validateLoginInput = [
  body("email")
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Введите пароль").trim(),
];

// Login route
router.post("/login", validateLoginInput, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Ошибка валидации",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Неверный email или пароль",
      });
    } // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Неверный email или пароль",
      });
    }

    // Generate JWT token with proper expiration
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    // Send response without sensitive info
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      role: user.role,
      department: user.department,
      position: user.position,
      employeeId: user.employeeId,
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      status: "error",
      message: "Ошибка сервера при входе в систему",
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    // Get fresh user data (in case anything changed)
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      role: user.role,
      department: user.department,
      position: user.position,
      employeeId: user.employeeId,
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(500).json({
      status: "error",
      message: "Error getting user info",
    });
  }
});

module.exports = router;
