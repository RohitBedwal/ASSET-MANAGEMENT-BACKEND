import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU code is required"],
      unique: true,
    },
    type: {
      type: String,
      required: [true, "Device type is required"],
    },
    serial: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
    },
    assignedTo: {
      type: String,
      default: null,
    },
    warrantyEndDate: { type: String },
    status: {
      type: String,
      enum: ["inward", "outward"],
      default: "inward",
    },
    projectName: {
      type: String,
      default: null,
    },
    assignedDate: {
      type: String,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
  },
  { timestamps: true }
);

const Device = mongoose.model("Device", deviceSchema);
export default Device;
