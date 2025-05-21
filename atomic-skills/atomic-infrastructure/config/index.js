require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  mongoURI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/atomic-skills",
  jwtSecret: process.env.JWT_SECRET || "atomic-skills-secret-key-2025",
  jwtExpiration: "24h",
};

console.log("Loaded configuration:", {
  port: config.port,
  mongoURI: config.mongoURI,
  jwtExpiration: config.jwtExpiration,
});

module.exports = config;
