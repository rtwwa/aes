const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple_choice", "essay"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  // For multiple choice questions
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  // For essay questions
  sampleAnswer: {
    type: String,
    required: function () {
      return this.type === "essay";
    },
  },
  maxScore: {
    type: Number,
    required: true,
    default: 1,
  },
});

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      required: true,
    },
    questions: [questionSchema],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Test", testSchema);
