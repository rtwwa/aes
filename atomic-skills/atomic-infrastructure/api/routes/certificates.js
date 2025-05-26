const express = require("express");
const { auth } = require("../../middleware/auth");
const Certificate = require("../../database/models/Certificate");
const router = express.Router();

// Delete certificate (admin only or certificate owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ error: "Сертификат не найден" });
    }

    // Check if user is admin or certificate owner
    if (
      req.user.role !== "admin" &&
      certificate.userId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Нет прав на удаление сертификата" });
    }

    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: "Сертификат успешно удален" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ error: "Ошибка при удалении сертификата" });
  }
});

// Get user's certificates
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      userId: req.params.userId,
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

module.exports = router;
