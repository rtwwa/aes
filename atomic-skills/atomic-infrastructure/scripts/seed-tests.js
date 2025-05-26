const mongoose = require("mongoose");
const config = require("../config");
const Test = require("../database/models/Test");
const TestAssignment = require("../database/models/TestAssignment");
const User = require("../database/models/User");

const seedTestData = async () => {
  try {
    // Get admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("Admin user not found. Run seed.js first.");
    }

    // Clear existing test data
    await Test.deleteMany({});
    await TestAssignment.deleteMany({});

    // Create sample test
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
        {
          type: "multiple_choice",
          text: "Какие меры безопасности обязательны при работе с радиоактивными материалами?",
          options: [
            { text: "Использование защитной одежды", isCorrect: false },
            { text: "Дозиметрический контроль", isCorrect: false },
            { text: "Все вышеперечисленное", isCorrect: true },
          ],
          maxScore: 1,
        },
      ],
    });

    // Get employee user
    const employee = await User.findOne({ role: "employee" });
    if (employee) {
      // Create test assignment
      await TestAssignment.create({
        testId: test._id,
        assignedBy: admin._id,
        assignedTo: [employee._id],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "pending",
      });
    }

    console.log("Test data seeded successfully!");
  } catch (error) {
    console.error("Error seeding test data:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Directly run if this script is executed
if (require.main === module) {
  seedTestData();
}

module.exports = seedTestData;
