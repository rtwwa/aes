const jwt = require("jsonwebtoken");
const User = require("../database/models/User");
const config = require("../config");

const auth = async (req, res, next) => {
  try {
    console.log("Headers:", req.headers); // Debug log
    const authHeader = req.header("Authorization");
    console.log("Auth header:", authHeader); // Debug log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Extracted token:", token); // Debug log

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
      console.log("Decoded token:", decoded); // Debug log
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError); // Debug log
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.message === "Token expired") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Please authenticate." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authorize,
};
