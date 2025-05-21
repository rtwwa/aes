const mongoose = require("mongoose");
const config = require("../config");
const User = require("../database/models/User");

const seedUsers = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create admin user
    const admin = await User.create({
      employeeId: "ADMIN001",
      firstName: "Admin",
      lastName: "System",
      email: "admin@aes.com",
      password: "admin123", // Will be hashed by the model's pre-save hook
      department: "IT",
      position: "System Administrator",
      role: "admin",
    });
    console.log("Created admin user:", admin.email);

    // Create test employee
    const employee = await User.create({
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Smith",
      email: "john@aes.com",
      password: "employee123", // Will be hashed by the model's pre-save hook
      department: "Operations",
      position: "Operator",
      role: "employee",
    });
    console.log("Created employee user:", employee.email);

    console.log("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();
