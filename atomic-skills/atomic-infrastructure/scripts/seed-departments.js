const mongoose = require("mongoose");
const User = require("../database/models/User");
const Test = require("../database/models/Test");
const TestAssignment = require("../database/models/TestAssignment");
const DEPARTMENTS = require("../config/departments");
const bcrypt = require("bcryptjs");

const users = [
  {
    firstName: "Иван",
    lastName: "Петров",
    email: "petrov@npp.com",
    password: "operator123",
    employeeId: "RO001",
    position: "Ведущий инженер по управлению реактором",
    department: "operations",
    role: "employee",
  },
  {
    firstName: "Мария",
    lastName: "Иванова",
    email: "ivanova@npp.com",
    password: "safety123",
    employeeId: "RS001",
    position: "Начальник отдела радиационной безопасности",
    department: "radiation_safety",
    role: "admin",
  },
  {
    firstName: "Алексей",
    lastName: "Смирнов",
    email: "smirnov@npp.com",
    password: "chemistry123",
    employeeId: "CH001",
    position: "Инженер-химик",
    department: "chemistry",
    role: "employee",
  },
  {
    firstName: "Дмитрий",
    lastName: "Козлов",
    email: "kozlov@npp.com",
    password: "turbine123",
    employeeId: "TU001",
    position: "Инженер турбинного отделения",
    department: "turbine",
    role: "employee",
  },
  {
    firstName: "Елена",
    lastName: "Соколова",
    email: "sokolova@npp.com",
    password: "training123",
    employeeId: "TR001",
    position: "Руководитель учебного центра",
    department: "training",
    role: "admin",
  },
];

const tests = [
  {
    title: "Основы ядерной безопасности",
    description: "Базовый тест по ядерной безопасности для всех сотрудников",
    category: "safety",
    skillLevel: "beginner",
    duration: 30,
    passingScore: 80,
    questions: [
      {
        type: "multiple_choice",
        text: "Что такое ядерная безопасность?",
        options: [
          { text: "Защита от радиации", isCorrect: false },
          {
            text: "Предотвращение неконтролируемой цепной реакции",
            isCorrect: true,
          },
          { text: "Охрана периметра АЭС", isCorrect: false },
          { text: "Утилизация отходов", isCorrect: false },
        ],
        maxScore: 1,
      },
      {
        type: "multiple_choice",
        text: "Какой документ необходимо оформить перед входом в зону контролируемого доступа?",
        options: [
          { text: "Пропуск", isCorrect: false },
          { text: "Наряд-допуск", isCorrect: true },
          { text: "Маршрутный лист", isCorrect: false },
          { text: "Удостоверение личности", isCorrect: false },
        ],
        maxScore: 1,
      },
    ],
  },
  {
    title: "Радиационная безопасность в химическом цехе",
    description: "Специализированный тест для сотрудников химического цеха",
    category: "radiation_safety",
    skillLevel: "intermediate",
    duration: 45,
    passingScore: 85,
    questions: [
      {
        type: "multiple_choice",
        text: "Какие средства индивидуальной защиты необходимы при работе с радиоактивными пробами?",
        options: [
          { text: "Только перчатки", isCorrect: false },
          { text: "Перчатки и маска", isCorrect: false },
          { text: "Полный комплект СИЗ включая респиратор", isCorrect: true },
          { text: "Достаточно халата", isCorrect: false },
        ],
        maxScore: 1,
      },
      {
        type: "essay",
        text: "Опишите порядок действий при обнаружении радиоактивного загрязнения на рабочем месте",
        sampleAnswer:
          "1. Немедленно прекратить работу\n2. Оповестить персонал в помещении\n3. Сообщить руководителю работ\n4. Вызвать службу радиационной безопасности\n5. Оградить загрязненную зону\n6. Документировать инцидент",
        maxScore: 2,
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/atomic-skills"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Test.deleteMany({});
    await TestAssignment.deleteMany({});

    // Create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);

    // Create tests
    const adminUser = createdUsers.find((u) => u.role === "admin");
    const createdTests = await Test.insertMany(
      tests.map((test) => ({
        ...test,
        createdBy: adminUser._id,
      }))
    );

    // Create test assignments
    const chemistryUsers = createdUsers.filter(
      (u) => u.department === "chemistry"
    );
    const radiationSafetyTest = createdTests.find(
      (t) => t.category === "radiation_safety"
    );
    const basicSafetyTest = createdTests.find(
      (t) => t.title === "Основы ядерной безопасности"
    );

    // Assign radiation safety test to chemistry department
    if (radiationSafetyTest) {
      await TestAssignment.create({
        testId: radiationSafetyTest._id,
        assignedBy: adminUser._id,
        department: "chemistry",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
    }

    // Assign basic safety test to all users
    if (basicSafetyTest) {
      await TestAssignment.create({
        testId: basicSafetyTest._id,
        assignedBy: adminUser._id,
        assignedTo: createdUsers.map((u) => u._id),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });
    }

    console.log("Database seeded successfully");

    // Print test credentials
    console.log("\nTest credentials:");
    createdUsers.forEach((user) => {
      const originalUser = users.find((u) => u.email === user.email);
      console.log(`\nEmail: ${user.email}`);
      console.log(`Password: ${originalUser.password}`);
      console.log(`Role: ${user.role}`);
      console.log(
        `Department: ${DEPARTMENTS.find((d) => d.id === user.department).name}`
      );
    });
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the seed function
seedDatabase();
