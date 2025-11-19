import Vendor from "../models/Vendor.js";

// 📦 Get all vendors
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➕ Add new vendor
export const addVendor = async (req, res) => {
  try {
    const { vendor, contact, email, phone, status } = req.body;
    if (!vendor || !contact || !email || !phone)
      return res.status(400).json({ message: "All required fields must be filled" });

    const newVendor = new Vendor({
      vendor,
      contact,
      email,
      phone,
      status: status || "Active",
    });

    await newVendor.save();
    res.status(201).json(newVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update vendor
export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const updates = req.body;
    Object.assign(vendor, updates);
    await vendor.save();

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete vendor
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    await vendor.deleteOne();
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
