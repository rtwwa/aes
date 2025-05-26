const express = require("express");
const { body, validationResult } = require("express-validator");
const Test = require("../../database/models/Test");
const TestResult = require("../../database/models/TestResult");
const TestAssignment = require("../../database/models/TestAssignment");
const Certificate = require("../../database/models/Certificate");
const mongoose = require("mongoose");
const { auth } = require("../../middleware/auth");
const router = express.Router();

// Get all tests
router.get("/", auth, async (req, res) => {
  try {
    const tests = await Test.find()
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ error: "Ошибка при получении списка тестов" });
  }
});

// Get user's test assignments
router.get("/assignments", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department;

    // Validate user data
    if (!userId) {
      return res.status(400).json({ error: "ID пользователя не определен" });
    }

    // Find assignments for user (direct or via department)
    const assignments = await TestAssignment.find({
      $or: [
        { assignedTo: userId },
        { department: userDepartment, status: "pending" },
      ],
    })
      .populate({
        path: "testId",
        select: "title description duration passingScore",
        // Проверяем существование теста
        match: { _id: { $exists: true } },
      })
      .sort({ dueDate: 1 });

    // Фильтруем назначения с несуществующими тестами
    const validAssignments = assignments.filter(
      (assignment) => assignment.testId != null
    );

    // Если есть назначения с несуществующими тестами, логируем это
    if (validAssignments.length !== assignments.length) {
      console.error(
        "Found assignments with missing tests:",
        assignments.filter((a) => !a.testId).map((a) => a._id)
      );
    }

    res.json(validAssignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      error: "Ошибка при получении назначенных тестов",
      details: error.message,
    });
  }
});

// Get user's certificates
router.get("/certificates", auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      userId: req.user._id,
    })
      .populate({
        path: "testId",
        select: "title description",
      })
      .populate({
        path: "testResultId",
        select: "score",
      })
      .sort({ issueDate: -1 });

    res.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ error: "Ошибка при получении сертификатов" });
  }
});

// Get test by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Неверный формат ID теста" });
    }

    const test = await Test.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );

    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    // Check if user has access to this test
    const assignment = await TestAssignment.findOne({
      testId: req.params.id,
      $or: [{ assignedTo: userId }, { department: userDepartment }],
      status: "pending",
    });

    // If user is admin or test creator, allow access
    const isAdminOrCreator =
      req.user.role === "admin" ||
      test.createdBy._id.toString() === userId.toString();

    if (!assignment && !isAdminOrCreator) {
      // Check if the test was completed
      const completedAssignment = await TestAssignment.findOne({
        testId: req.params.id,
        $or: [{ assignedTo: userId }, { department: userDepartment }],
        status: "completed",
      });

      if (completedAssignment) {
        return res.status(403).json({
          error: "Этот тест уже был выполнен вами",
          completed: true,
        });
      }

      return res.status(403).json({
        error: "У вас нет доступа к этому тесту",
        reason: "not_assigned",
      });
    }

    res.json(test);
  } catch (error) {
    console.error("Error fetching test:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Неверный формат ID теста" });
    }
    res.status(500).json({ error: "Ошибка при получении теста" });
  }
});

// Create new test
router.post(
  "/",
  auth,
  [
    body("title").notEmpty().withMessage("Название теста обязательно"),
    body("description").notEmpty().withMessage("Описание теста обязательно"),
    body("category").notEmpty().withMessage("Категория обязательна"),
    body("skillLevel")
      .isIn(["beginner", "intermediate", "advanced", "expert"])
      .withMessage("Некорректный уровень квалификации"),
    body("duration")
      .isInt({ min: 1 })
      .withMessage("Длительность должна быть положительным числом"),
    body("passingScore")
      .isInt({ min: 1 })
      .withMessage("Проходной балл должен быть положительным числом"),
    body("questions")
      .isArray({ min: 1 })
      .withMessage("Тест должен содержать хотя бы один вопрос"),
    body("questions.*.text").notEmpty().withMessage("Текст вопроса обязателен"),
    body("questions.*.type")
      .isIn(["multiple_choice", "essay"])
      .withMessage("Некорректный тип вопроса"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const test = new Test({
        ...req.body,
        createdBy: req.user._id,
      });

      await test.save();
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ error: "Ошибка при создании теста" });
    }
  }
);

// Update test
router.put("/:id", auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    if (
      test.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Нет прав на редактирование теста" });
    }

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedTest);
  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).json({ error: "Ошибка при обновлении теста" });
  }
});

// Delete test
router.delete("/:id", auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }
    if (
      test.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Нет прав на удаление теста" });
    }

    // Начинаем транзакцию для удаления теста и связанных данных
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Удаляем все назначения этого теста
      await TestAssignment.deleteMany({ testId: req.params.id }).session(
        session
      );

      // Удаляем все результаты этого теста
      await TestResult.deleteMany({ testId: req.params.id }).session(session);

      // Удаляем все сертификаты, связанные с этим тестом
      await Certificate.deleteMany({ testId: req.params.id }).session(session);

      // Удаляем сам тест
      await Test.findByIdAndDelete(req.params.id).session(session);

      // Если всё прошло успешно, фиксируем транзакцию
      await session.commitTransaction();
      res.json({ message: "Тест и все связанные данные успешно удалены" });
    } catch (error) {
      // В случае ошибки отменяем все изменения
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({ error: "Ошибка при удалении теста" });
  }
});

// Get available tests for the current user
router.get("/available", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department; // Find all test assignments for this user (either directly or via department)
    const assignments = await TestAssignment.find({
      $or: [{ assignedTo: userId }, { department: userDepartment }],
      status: "pending",
    });

    if (!assignments || assignments.length === 0) {
      return res.json([]); // Return empty array if no assignments found
    }

    const testIds = assignments.map((a) => a.testId);

    // Get the full test details, excluding sensitive information
    const tests = await Test.find({
      _id: { $in: testIds },
    })
      .select("title description category skillLevel duration passingScore")
      .populate("createdBy", "firstName lastName");

    res.json(tests);
  } catch (error) {
    console.error("Error fetching available tests:", error);
    res.status(500).json({ error: "Ошибка при получении доступных тестов" });
  }
});

// Get test to take
router.get("/take/:id", auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).select({
      title: 1,
      description: 1,
      duration: 1,
      questions: {
        $map: {
          input: "$questions",
          as: "question",
          in: {
            _id: "$$question._id",
            type: "$$question.type",
            text: "$$question.text",
            options: {
              $map: {
                input: "$$question.options",
                as: "option",
                in: {
                  text: "$$option.text",
                },
              },
            },
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    // Verify that the user is assigned to this test
    const assignment = await TestAssignment.findOne({
      testId: req.params.id,
      $or: [{ assignedTo: req.user._id }, { department: req.user.department }],
      status: "pending",
    });

    if (!assignment) {
      return res.status(403).json({ error: "У вас нет доступа к этому тесту" });
    }

    res.json(test);
  } catch (error) {
    console.error("Error fetching test for taking:", error);
    res.status(500).json({ error: "Ошибка при получении теста" });
  }
});

// Submit test
router.post("/:id/submit", auth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    if (!answers || typeof timeSpent !== "number") {
      return res.status(400).json({ error: "Некорректные данные теста" });
    }

    const userId = req.user._id;
    const testId = req.params.id;

    // Get the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    // Verify test assignment
    const assignment = await TestAssignment.findOne({
      testId,
      $or: [{ assignedTo: userId }, { department: req.user.department }],
      status: "pending",
    });

    if (!assignment) {
      return res
        .status(403)
        .json({ error: "Тест не назначен или уже завершен" });
    } // Calculate score
    let correctAnswers = 0;
    test.questions.forEach((question) => {
      if (question.type === "multiple_choice") {
        const userAnswer = answers[question._id];
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (correctOption && userAnswer === correctOption.text) {
          correctAnswers++;
        }
      }
      // Essay questions are evaluated manually
    });

    const score = Math.round((correctAnswers / test.questions.length) * 100);
    const passed = score >= test.passingScore;

    // Create test result
    const testResult = new TestResult({
      userId,
      testId,
      answers,
      score,
      timeSpent,
      passed,
      completedAt: new Date(),
    });
    await testResult.save();

    // Update assignment status
    await TestAssignment.updateMany(
      {
        testId,
        $or: [{ assignedTo: userId }, { department: req.user.department }],
        status: "pending",
      },
      { status: "completed" }
    );

    res.json({
      score,
      passed,
      testResultId: testResult._id,
    });
  } catch (error) {
    console.error("Error submitting test:", error);

    // Send more specific error messages for known error types
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Некорректные данные теста" });
    }

    res.status(500).json({ error: "Ошибка при отправке результатов теста" });
  }
});

// Generate certificate
router.post("/:id/certificate", auth, async (req, res) => {
  try {
    const { testResultId } = req.body;
    const userId = req.user._id;
    const testId = req.params.id;

    // Get test result
    const testResult = await TestResult.findById(testResultId);
    if (!testResult || testResult.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: "Результат теста не найден" });
    }

    if (!testResult.passed) {
      return res.status(400).json({ error: "Тест не был пройден успешно" });
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${userId
      .toString()
      .slice(-4)}`;

    // Create certificate
    const certificate = new Certificate({
      userId,
      testId,
      testResultId,
      certificateNumber,
      score: testResult.score,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Valid for 180 days
      status: "active",
    });

    await certificate.save();

    res.json(certificate);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ error: "Ошибка при создании сертификата" });
  }
});

// Assign test to users or department
router.post("/assign", auth, async (req, res) => {
  try {
    const { testId, assignedTo, department, dueDate } = req.body;

    // Verify test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    let assignment;
    if (department) {
      // Assign to department
      assignment = await TestAssignment.create({
        testId,
        assignedBy: req.user._id,
        department,
        dueDate,
      });
    } else if (assignedTo && assignedTo.length > 0) {
      // Assign to specific users
      assignment = await TestAssignment.create({
        testId,
        assignedBy: req.user._id,
        assignedTo,
        dueDate,
      });
    } else {
      return res
        .status(400)
        .json({ error: "Укажите отдел или список пользователей" });
    }

    // TODO: Send notifications to assigned users

    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error assigning test:", error);
    res.status(500).json({ error: "Ошибка при назначении теста" });
  }
});

// Get user's test assignments
router.get("/assignments", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department;

    // Validate user data
    if (!userId) {
      return res.status(400).json({ error: "ID пользователя не определен" });
    }

    // Find assignments for user (direct or via department)
    const assignments = await TestAssignment.find({
      $or: [
        { assignedTo: userId },
        { department: userDepartment, status: "pending" },
      ],
    })
      .populate({
        path: "testId",
        select: "title description duration passingScore",
        // Проверяем существование теста
        match: { _id: { $exists: true } },
      })
      .sort({ dueDate: 1 });

    // Фильтруем назначения с несуществующими тестами
    const validAssignments = assignments.filter(
      (assignment) => assignment.testId != null
    );

    // Если есть назначения с несуществующими тестами, логируем это
    if (validAssignments.length !== assignments.length) {
      console.error(
        "Found assignments with missing tests:",
        assignments.filter((a) => !a.testId).map((a) => a._id)
      );
    }

    res.json(validAssignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      error: "Ошибка при получении назначенных тестов",
      details: error.message,
    });
  }
});

// Get user's certificates
router.get("/certificates", auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      userId: req.user._id,
    })
      .populate({
        path: "testId",
        select: "title description",
      })
      .populate({
        path: "testResultId",
        select: "score",
      })
      .sort({ issueDate: -1 });

    res.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ error: "Ошибка при получении сертификатов" });
  }
});

// Download certificate
router.get("/certificates/:id/download", auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("testId", "title")
      .populate("userId", "firstName lastName");

    if (!certificate) {
      return res.status(404).json({ error: "Сертификат не найден" });
    }

    if (certificate.userId._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Нет прав на доступ к сертификату" });
    }

    res.json(certificate);
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({ error: "Ошибка при скачивании сертификата" });
  }
});

// Get completed tests stats
router.get("/completed-count", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ error: "ID пользователя не определен" });
    }

    // Aggregate test results for user
    const results = await TestResult.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          completedCount: { $sum: 1 },
          totalScore: { $sum: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = results[0] || { completedCount: 0, totalScore: 0, count: 0 };
    const averageScore =
      stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;

    res.json({
      completedCount: stats.completedCount,
      averageScore,
    });
  } catch (error) {
    console.error("Error getting completed tests stats:", error);
    res.status(500).json({
      error: "Ошибка при получении статистики тестов",
      details: error.message,
    });
  }
});

// Get user's progress
router.get("/user-progress/:userId", auth, async (req, res) => {
  try {
    // Проверяем права доступа
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.userId
    ) {
      return res.status(403).json({ error: "Нет доступа к этой информации" });
    }

    // Проверяем валидность ID
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: "Неверный формат ID пользователя" });
    }

    // Получаем все назначенные тесты пользователя
    const assignments = await TestAssignment.find({
      assignedTo: req.params.userId,
    })
      .populate({
        path: "testId",
        select: "title description duration",
      })
      .sort({ updatedAt: -1 });

    // Получаем результаты тестов
    const testResults = await TestResult.find({
      userId: req.params.userId,
    }).select("testId score passed timeSpent completedAt");

    // Объединяем информацию
    const progressData = assignments.map((assignment) => ({
      _id: assignment._id,
      testId: assignment.testId,
      status: assignment.status,
      dueDate: assignment.dueDate,
      updatedAt: assignment.updatedAt,
      score:
        testResults.find(
          (r) => r.testId.toString() === assignment.testId._id.toString()
        )?.score || null,
    }));

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({
      error: "Ошибка при получении прогресса пользователя",
      details: error.message,
    });
  }
});

module.exports = router;
