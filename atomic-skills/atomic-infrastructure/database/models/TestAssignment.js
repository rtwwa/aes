const mongoose = require("mongoose");

const testAssignmentSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    department: {
      type: String,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
    },
    notificationsSent: [
      {
        type: String,
        enum: ["assigned", "reminder", "overdue"],
      },
    ],
  },
  { timestamps: true }
);

// Ensure either assignedTo or department is specified
testAssignmentSchema.pre("save", function (next) {
  if (!this.assignedTo?.length && !this.department) {
    next(new Error("Either assignedTo or department must be specified"));
  }
  next();
});

// Index for querying assignments by user
testAssignmentSchema.index({ assignedTo: 1 });
// Index for querying assignments by department
testAssignmentSchema.index({ department: 1 });
// Index for querying by status
testAssignmentSchema.index({ status: 1 });
// Index for querying assignments by user and department
testAssignmentSchema.index({ assignedTo: 1, status: 1 });
testAssignmentSchema.index({ department: 1, status: 1 });
testAssignmentSchema.index({ dueDate: 1 }); // For finding expired assignments

module.exports = mongoose.model("TestAssignment", testAssignmentSchema);
