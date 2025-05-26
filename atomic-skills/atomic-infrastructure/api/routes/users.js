const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../../database/models/User");
const { auth } = require("../../middleware/auth");
const DEPARTMENTS = require("../../config/departments");
const router = express.Router();

// Get all users (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ error: "Ошибка при получении списка пользователей" });
  }
});

// Create new user (admin only)
router.post(
  "/",
  auth,
  [
    body("firstName").notEmpty().withMessage("Имя обязательно"),
    body("lastName").notEmpty().withMessage("Фамилия обязательна"),
    body("position").notEmpty().withMessage("Должность обязательна"),
    body("department").notEmpty().withMessage("Отдел обязателен"),
    body("email").isEmail().withMessage("Введите корректный email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль должен быть не менее 6 символов"),
    body("employeeId").notEmpty().withMessage("Табельный номер обязателен"),
    body("role").isIn(["employee", "admin"]).withMessage("Неверная роль"),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user with this email or employeeId already exists
      const existingUser = await User.findOne({
        $or: [{ email: req.body.email }, { employeeId: req.body.employeeId }],
      });

      if (existingUser) {
        return res.status(400).json({
          error:
            "Пользователь с таким email или табельным номером уже существует",
        });
      }

      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName,
        position: req.body.position,
        department: req.body.department,
        email: req.body.email,
        password: req.body.password,
        employeeId: req.body.employeeId,
        role: req.body.role || "employee",
      });

      await newUser.save();

      // Remove password from response
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Ошибка при создании пользователя" });
    }
  }
);

// Get all departments
router.get("/departments", auth, async (req, res) => {
  try {
    res.json(DEPARTMENTS);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Ошибка при получении списка отделов" });
  }
});

// Get users by department
router.get("/by-department/:departmentId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const users = await User.find(
      { department: req.params.departmentId },
      { password: 0 }
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by department:", error);
    res
      .status(500)
      .json({ error: "Ошибка при получении пользователей отдела" });
  }
});

// Update user
router.put(
  "/:id",
  auth,
  [
    body("firstName").optional().notEmpty().withMessage("Имя обязательно"),
    body("lastName").optional().notEmpty().withMessage("Фамилия обязательна"),
    body("position").optional().notEmpty().withMessage("Должность обязательна"),
    body("department").optional().notEmpty().withMessage("Отдел обязателен"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Пароль должен быть не менее 6 символов"),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Доступ запрещен" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = { ...req.body };
      delete updateData.role; // Prevent role changes through this endpoint

      if (updateData.password) {
        const user = await User.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ error: "Пользователь не найден" });
        }
        user.password = updateData.password;
        await user.save(); // This will trigger password hashing
        delete updateData.password;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Ошибка при обновлении пользователя" });
    }
  }
);

// Export the router
module.exports = router;
