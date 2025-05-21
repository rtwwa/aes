const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredLevel: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    validationCriteria: [
      {
        type: String,
        required: true,
      },
    ],
    department: {
      type: String,
      required: true,
    },
    prerequisites: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
        },
        requiredLevel: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
