import express from "express";
import {
  addDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from "../controllers/deviceController.js";

const router = express.Router();

router.route("/")
  .get(getDevices)
  .post(addDevice);

router.route("/:id")
  .get(getDeviceById)
  .put(updateDevice)
  .delete(deleteDevice);

export default router;
