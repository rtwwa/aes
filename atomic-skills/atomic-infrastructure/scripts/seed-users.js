const mongoose = require("mongoose");
const config = require("../config");
const User = require("../database/models/User");
const Test = require("../database/models/Test");
const TestAssignment = require("../database/models/TestAssignment");

const seedUsers = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Test.deleteMany({});
    await TestAssignment.deleteMany({});
    console.log("Cleared existing data");

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

    // Create a test
    const test = await Test.create({
      title: "Базовые знания о ядерной безопасности",
      description: "Тест на проверку базовых знаний о ядерной безопасности",
      category: "safety",
      skillLevel: "beginner",
      duration: 30,
      passingScore: 70,
      createdBy: admin._id,
      questions: [
        {
          type: "multiple_choice",
          text: "Что такое ядерная безопасность?",
          options: [
            { text: "Защита от радиации", isCorrect: false },
            {
              text: "Комплекс мер по обеспечению безопасной работы АЭС",
              isCorrect: true,
            },
            { text: "Система охраны АЭС", isCorrect: false },
          ],
          maxScore: 1,
        },
      ],
    });

    // Assign test to employee
    await TestAssignment.create({
      testId: test._id,
      assignedBy: admin._id,
      assignedTo: [employee._id],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "pending",
    });

    console.log("Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();
