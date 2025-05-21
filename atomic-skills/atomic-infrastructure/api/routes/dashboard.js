const express = require("express");
const { auth } = require("../../middleware/auth");
const Assessment = require("../../database/models/Assessment");
const Skill = require("../../database/models/Skill");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    // Get total skills for user's department
    const totalSkills = await Skill.countDocuments({
      department: req.user.department,
    });

    // Get completed skills for the user
    const completedSkills = await Assessment.countDocuments({
      employee: req.user._id,
      status: "completed",
    });

    // Get pending assessments
    const pendingAssessments = await Assessment.countDocuments({
      employee: req.user._id,
      status: "pending",
    });

    // Get recent activities
    const recentActivities = await Assessment.find({
      employee: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("skill", "name")
      .populate("assessor", "firstName lastName")
      .lean();

    const activities = recentActivities.map((activity) => ({
      title: activity.skill.name,
      description: `Status: ${activity.status}${
        activity.assessor
          ? ` | Assessor: ${activity.assessor.firstName} ${activity.assessor.lastName}`
          : ""
      }`,
      date: activity.updatedAt.toLocaleDateString(),
    }));

    res.json({
      totalSkills,
      completedSkills,
      pendingAssessments,
      recentActivities: activities,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
