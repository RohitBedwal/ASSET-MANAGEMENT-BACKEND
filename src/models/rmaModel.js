import mongoose from "mongoose";

const rmaSchema = new mongoose.Schema(
  {
    rmaNumber: {
      type: String,
      unique: true,
    },

    // User submitted details
    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
    },

    invoiceNumber: {
      type: String,
      default: null,
    },

    poNumber: {
      type: String,
      default: null,
    },

    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      default: null, // Will be linked by admin after verification
    },

    status: {
      type: String,
      enum: [
        "pending_review", // Initial state - waiting for admin review
        "approved",
        "rejected",
        "in_transit_to_vendor",
        "received_by_vendor",
        "under_repair",
        "repaired",
        "replaced",
        "in_transit_to_client",
        "completed",
        "cancelled"
      ],
      default: "pending_review",
    },

    rmaType: {
      type: String,
      enum: ["repair", "replacement", "refund"],
      required: [true, "RMA type is required"],
    },

    reason: {
      type: String,
      default: null,
    },

    issueDescription: {
      type: String,
      required: [true, "Issue description is required"],
    },

    description: {
      type: String,
      default: null,
    },

    reportedBy: {
      type: String,
      required: [true, "Reporter name is required"],
    },

    reportedByEmail: {
      type: String,
      default: null,
    },

    reportedByPhone: {
      type: String,
      default: null,
    },

    // Attachments - User uploaded files
    attachments: {
      invoice: {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
      purchaseOrder: {
        filename: String,
        path: String,
        uploadedAt: Date,
      },
      photos: [
        {
          filename: String,
          path: String,
          uploadedAt: Date,
        },
      ],
      additionalDocs: [
        {
          filename: String,
          path: String,
          description: String,
          uploadedAt: Date,
        },
      ],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    vendorRmaNumber: {
      type: String,
      default: null,
    },

    shippingTrackingNumber: {
      type: String,
      default: null,
    },

    estimatedReturnDate: {
      type: Date,
      default: null,
    },

    actualReturnDate: {
      type: Date,
      default: null,
    },

    repairCost: {
      type: Number,
      default: 0,
    },

    replacementDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },

    resolutionNotes: {
      type: String,
      default: null,
    },

    internalNotes: {
      type: String,
      default: null,
    },

    approvedBy: {
      type: String,
      default: null,
    },

    approvedDate: {
      type: Date,
      default: null,
    },

    completedDate: {
      type: Date,
      default: null,
    },

    // Admin review fields
    reviewedBy: {
      type: String,
      default: null,
    },

    reviewedDate: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    // Timeline tracking
    statusHistory: [
      {
        status: String,
        updatedBy: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],

    // Notification flags
    isNewSubmission: {
      type: Boolean,
      default: true,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-increment RMA number with date prefix
rmaSchema.pre("save", async function (next) {
  if (this.isNew && !this.rmaNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("RMA").countDocuments();
    this.rmaNumber = `RMA-${year}${month}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const RMA = mongoose.model("RMA", rmaSchema);
export default RMA;
