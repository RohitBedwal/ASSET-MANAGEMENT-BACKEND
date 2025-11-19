import Device from "../models/deviceModel.js";
import Category from "../models/categoryModel.js";

// 🟢 Add new device
export const addDevice = async (req, res) => {
  try {
    const { type, serial, assignedTo, categoryId } = req.body;

    // 🔹 Validate required fields
    if (!type || !serial || !categoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔹 Check if category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 🔹 Prevent duplicate serial numbers
    const existing = await Device.findOne({ serial });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Device with this serial already exists" });
    }

    // 🔹 Generate SKU (unique internal ID)
    const skuPrefix = (type || "GEN").substring(0, 3).toUpperCase();
    const sku = `${skuPrefix}-${Math.floor(Math.random() * 900 + 100)}`;

    // 🔹 Create new device
    const device = await Device.create({
      sku,
      type,
      serial,
      assignedTo,
      categoryId,
      status: "inward", // default
    });

    res.status(201).json(device);
  } catch (error) {
    console.error("Error adding device:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🟣 Get all devices (optional filter by category)
export const getDevices = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const query = categoryId ? { categoryId } : {};

    const devices = await Device.find(query).populate("categoryId", "name");
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 Get single device by ID
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate(
      "categoryId",
      "name"
    );
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Update device (assign/unassign)
export const updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const { projectName, assignedDate, status } = req.body;

    // Auto calculate warranty end date when assigning
    let warrantyEndDate = device.warrantyEndDate;
    if (assignedDate) {
      const date = new Date(assignedDate);
      date.setFullYear(date.getFullYear() + 1);
      warrantyEndDate = date.toISOString().split("T")[0];
    }

    device.status = status || device.status;
    device.projectName = projectName || null;
    device.assignedDate = assignedDate || null;
    device.warrantyEndDate = warrantyEndDate || null;

    const updated = await device.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔴 Delete device
export const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    await device.deleteOne();
    res.json({ message: "Device removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
