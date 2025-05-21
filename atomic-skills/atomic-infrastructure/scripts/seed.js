const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config");
const User = require("../database/models/User");
const Skill = require("../database/models/Skill");

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("Connected to MongoDB");

    // Очистка существующих данных
    await User.deleteMany({});
    await Skill.deleteMany({}); // Create test admin user
    const admin = await User.create({
      employeeId: "ADMIN001",
      firstName: "Админ",
      lastName: "Системы",
      email: "admin@aes.com",
      password: "admin123", // Will be hashed by the User model's pre-save hook
      department: "IT",
      position: "System Administrator",
      role: "admin",
    });

    const employee = await User.create({
      employeeId: "EMP001",
      firstName: "Иван",
      lastName: "Петров",
      email: "ivan@aes.com",
      password: "admin123",
      department: "Operations",
      position: "Operator",
      role: "employee",
    });

    // Создание тестовых навыков
    const skills = await Skill.insertMany([
      {
        name: "Управление реактором",
        category: "Операционные навыки",
        description: "Базовые навыки управления ядерным реактором",
        requiredLevel: 5,
        validationCriteria: [
          "Знание принципов работы реактора",
          "Умение контролировать параметры",
          "Навыки действий в нештатных ситуациях",
        ],
        department: "Operations",
      },
      {
        name: "Радиационная безопасность",
        category: "Безопасность",
        description: "Основные принципы радиационной безопасности",
        requiredLevel: 4,
        validationCriteria: [
          "Знание норм радиационной безопасности",
          "Умение использовать средства защиты",
          "Навыки радиационного контроля",
        ],
        department: "Operations",
      },
    ]);

    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
