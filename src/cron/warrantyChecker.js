import cron from "node-cron";
import Device from "../models/deviceModel.js";
import { io } from "../../server.js";

export const scheduleWarrantyCheck = () => {
  console.log("⏱ Warranty check scheduler started");

  // Runs every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("🔍 Checking for expiring warranties...");

    const currentDate = new Date();
    const expiryLimit = new Date();
    expiryLimit.setDate(currentDate.getDate() + 30);

    const expiringDevices = await Device.find({
      warrantyEndDate: { $lte: expiryLimit, $gte: currentDate }
    });

    expiringDevices.forEach((device) => {
      io.emit("expiry-alert", {
        message: `Warranty expiring soon: ${device.sku}`,
        sku: device.sku,
        expiryDate: device.warrantyEndDate,
        time: new Date()
      });
    });
  });
};
