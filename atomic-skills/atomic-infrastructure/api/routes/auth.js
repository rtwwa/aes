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
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required").trim(),
];

// Login route
router.post("/login", validateLoginInput, async (req, res) => {
  try {
    console.log("Login attempt with body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log("Attempting to find user with email:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found:", { email: user.email, role: user.role });

    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      console.log("Password comparison result:", isMatch);      if (!isMatch) {
        console.log("Password does not match");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
        expiresIn: config.jwtExpiration,
      });

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return res.status(500).json({ error: "Error validating credentials" });
      return res.status(500).json({ error: "Error validating credentials" });
    }

    // Create token
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiration,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error occurred during login" });
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user route
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
