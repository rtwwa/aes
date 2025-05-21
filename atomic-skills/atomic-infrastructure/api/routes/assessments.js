const express = require("express");
const { auth, authorize } = require("../../middleware/auth");
const Assessment = require("../../database/models/Assessment");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Получить все оценки пользователя
router.get("/user", auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({ employee: req.user._id })
      .populate("skill")
      .populate("assessor", "firstName lastName");
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получить оценки для проверки (для супервайзеров)
router.get(
  "/pending",
  auth,
  authorize("supervisor", "admin"),
  async (req, res) => {
    try {
      const assessments = await Assessment.find({
        status: "pending",
        department: req.user.department,
      })
        .populate("employee", "firstName lastName employeeId")
        .populate("skill");
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching pending assessments:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Создать запрос на оценку
router.post(
  "/",
  auth,
  [body("skillId").notEmpty().withMessage("Skill ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existingAssessment = await Assessment.findOne({
        employee: req.user._id,
        skill: req.body.skillId,
        status: { $in: ["pending", "in-progress"] },
      });

      if (existingAssessment) {
        return res.status(400).json({
          error: "Assessment request already exists for this skill",
        });
      }

      const assessment = new Assessment({
        employee: req.user._id,
        skill: req.body.skillId,
        status: "pending",
        currentLevel: 1,
        evidence: [
          {
            description: req.body.evidence || "Initial assessment request",
            dateSubmitted: new Date(),
          },
        ],
      });

      await assessment.save();

      const populatedAssessment = await Assessment.findById(assessment._id)
        .populate("skill")
        .populate("employee", "firstName lastName");

      res.status(201).json(populatedAssessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Обновить оценку (для супервайзеров)
router.put(
  "/:id",
  auth,
  authorize("supervisor", "admin"),
  [
    body("status")
      .isIn(["pending", "in-progress", "completed", "rejected"])
      .withMessage("Invalid status"),
    body("currentLevel")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Level must be between 1 and 5"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assessment = await Assessment.findById(req.params.id);

      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      assessment.status = req.body.status;
      if (req.body.currentLevel) {
        assessment.currentLevel = req.body.currentLevel;
      }

      if (req.body.feedback) {
        assessment.feedback.push({
          comment: req.body.feedback,
          author: req.user._id,
          date: new Date(),
        });
      }

      if (req.body.status === "completed") {
        assessment.completionDate = new Date();
        assessment.validUntil = new Date();
        assessment.validUntil.setFullYear(
          assessment.validUntil.getFullYear() + 1
        );
      }

      assessment.assessor = req.user._id;
      await assessment.save();

      const updatedAssessment = await Assessment.findById(assessment._id)
        .populate("skill")
        .populate("employee", "firstName lastName")
        .populate("assessor", "firstName lastName");

      res.json(updatedAssessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
