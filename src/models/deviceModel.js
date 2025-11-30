import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU code is required"],
      unique: true,
    },

    serial: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
    },

    // ✔ inward/outward used for inventory movement tracking
    status: {
      type: String,
      enum: ["inward", "outward"],
      default: "inward",
    },

    assignedTo: { type: String, default: null },
    projectName: { type: String, default: null },
    assignedDate: { type: Date, default: null },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },

    vendor: { type: String, default: null },
    purchaseOrderNumber: { type: String, default: null },
    invoiceNumber: { type: String, default: null },
    purchaseDate: { type: Date, default: null },
    warrantyEndDate: { type: Date, default: null },
    amcExpiryDate: { type: Date, default: null },

    // Attachments for device documentation
    attachments: {
      invoice: {
        filename: { type: String, default: null },
        path: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
      purchaseOrder: {
        filename: { type: String, default: null },
        path: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
      warranty: {
        filename: { type: String, default: null },
        path: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
      },
      photos: [{
        filename: { type: String, required: true },
        path: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      }],
      manuals: [{
        filename: { type: String, required: true },
        path: { type: String, required: true },
        description: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      }],
    },

    ipAddress: { type: String, default: null },
    macAddress: { type: String, default: null },
    firmwareOSVersion: { type: String, default: null },

    installedAtSite: { type: String, default: null },

    rackId: { type: String, default: null },
    rackUnit: { type: Number, default: null },
    dataCenter: { type: String, default: null },

    notes: { type: String, default: null },
  },
  { timestamps: true }
);

const Device = mongoose.model("Device", deviceSchema);
export default Device;
