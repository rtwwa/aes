const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    answers: {
      type: Object,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    timeSpent: {
      type: Number, // in seconds
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
    },
    reviewerComments: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for querying by user and test
testResultSchema.index({ userId: 1, testId: 1 });

// Index for querying pending reviews
testResultSchema.index({ reviewStatus: 1 });

// Index for statistics queries
testResultSchema.index({ userId: 1, score: 1, passed: 1 });

module.exports = mongoose.model("TestResult", testResultSchema);
