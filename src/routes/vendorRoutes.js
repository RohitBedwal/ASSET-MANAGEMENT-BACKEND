import express from "express";
import {
  getVendors,
  addVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

router.get("/", getVendors);
router.post("/", addVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
