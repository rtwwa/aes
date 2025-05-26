const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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
    testResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestResult",
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    score: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Generate unique certificate number before saving
certificateSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      },
    });
    this.certificateNumber = `CERT-${year}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

// Indexes
certificateSchema.index({ userId: 1 });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ status: 1 });
certificateSchema.index({ expiryDate: 1 });
certificateSchema.index({ userId: 1, status: 1 }); // Index for querying certificates

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;
