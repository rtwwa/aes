const express = require("express");
const { auth, authorize } = require("../../middleware/auth");
const Skill = require("../../database/models/Skill");
const Assessment = require("../../database/models/Assessment");

const router = express.Router();

// Get all skills for user's department
router.get("/", auth, async (req, res) => {
  try {
    const skills = await Skill.find({ department: req.user.department });

    // Get user's assessment levels for each skill
    const assessments = await Assessment.find({
      employee: req.user._id,
      status: "completed",
    }).select("skill currentLevel");

    // Create a map of skill levels
    const skillLevels = {};
    assessments.forEach((assessment) => {
      skillLevels[assessment.skill.toString()] = assessment.currentLevel;
    });

    // Combine skill data with assessment levels
    const skillsWithLevels = skills.map((skill) => ({
      ...skill.toObject(),
      currentLevel: skillLevels[skill._id.toString()] || 0,
    }));

    res.json(skillsWithLevels);
  } catch (error) {
    console.error("Get skills error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new skill (admin only)
router.post("/", [auth, authorize("admin")], async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch (error) {
    console.error("Create skill error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update skill (admin only)
router.put("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.json(skill);
  } catch (error) {
    console.error("Update skill error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete skill (admin only)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    // Delete related assessments
    await Assessment.deleteMany({ skill: req.params.id });
    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
