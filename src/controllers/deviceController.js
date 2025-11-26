import Device from "../models/deviceModel.js";
import Category from "../models/categoryModel.js";
import { io } from "../../server.js"; // ⭐ Import Socket.IO

// @desc Add Device
// @route POST /api/devices
export const addDevice = async (req, res) => {
  try {
    const {
      sku,
      serial,
      status,
      assignedTo,
      purchaseDate,
      warrantyEndDate,
      amcExpiryDate,
      vendor,
      purchaseOrderNumber,
      installedAtSite,
      ipAddress,
      macAddress,
      firmwareOSVersion,
      rackId,
      rackUnit,
      dataCenter,
      notes,
      categoryId,
    } = req.body;

    if (!sku || !serial || !categoryId) {
      return res.status(400).json({ message: "SKU, Serial & CategoryId are required" });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const existSku = await Device.findOne({ sku });
    if (existSku) {
      return res.status(400).json({ message: "SKU already exists" });
    }

    const existSerial = await Device.findOne({ serial });
    if (existSerial) {
      return res.status(400).json({ message: "Serial number already exists" });
    }

    const device = await Device.create({
      sku,
      serial,
      status,
      assignedTo,
      purchaseDate,
      warrantyEndDate,
      amcExpiryDate,
      vendor,
      purchaseOrderNumber,
      installedAtSite,
      ipAddress,
      macAddress,
      firmwareOSVersion,
      rackId,
      rackUnit,
      dataCenter,
      notes,
      categoryId,
    });

    // 🔔 Emit real-time notification
    io.emit("notification", {
      title: "New Device Added",
      message: `${device.sku} added under ${categoryExists.name}`,
      category: categoryExists.name,
      timestamp: new Date().toISOString(),
      type: "device_added",
    });

    return res.status(201).json(device);

  } catch (error) {
    console.error("Add Device Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get devices (optionally filtered by category)
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

// @desc Get device by ID
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate("categoryId", "name");
    if (!device) return res.status(404).json({ message: "Device not found" });

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update device
export const updateDevice = async (req, res) => {
  try {
    const updated = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Device not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete device
export const deleteDevice = async (req, res) => {
  try {
    const deleted = await Device.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Device not found" });

    res.json({ message: "Device removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
