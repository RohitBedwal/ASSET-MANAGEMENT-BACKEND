import express from "express";
import {
  createRMA,
  getRMAs,
  getRMAById,
  getRMAByNumber,
  updateRMAStatus,
  updateRMA,
  deleteRMA,
  getRMAStats,
  getPendingRMAsForAdmin,
  getMyRMARequests,
  approveRMA,
  rejectRMA,
  uploadRMAAttachment,
  debugUserInfo,
} from "../controllers/rmaController.js";
import {
  submitRMAWithFiles,
  downloadRMAAttachment,
} from "../controllers/rmaUploadController.js";
import { uploadRMAFiles } from "../config/multer.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Statistics route (protected - admin only)
router.get("/stats/overview", protect, adminOnly, getRMAStats);

// Debug route (protected)
router.get("/debug/user-info", protect, debugUserInfo);

// User submission with file upload (no auth required)
router.post("/submit", uploadRMAFiles, submitRMAWithFiles);

// User routes (protected - users see only their own RMAs)
router.get("/my-requests", protect, getMyRMARequests);
router.get("/number/:rmaNumber", protect, getRMAByNumber);

// Admin routes (must be before /:id)
router.get("/admin/pending", protect, adminOnly, getPendingRMAsForAdmin);
router.put("/:id/approve", protect, adminOnly, approveRMA);
router.put("/:id/reject", protect, adminOnly, rejectRMA);
router.post("/:id/upload", protect, adminOnly, uploadRMAAttachment);

// Download attachments (users can download their own, admins can download all)
router.get("/:id/download/:fileType/:index", protect, downloadRMAAttachment);
router.get("/:id/download/:fileType", protect, downloadRMAAttachment);

// Main CRUD routes
router.route("/")
  .get(protect, getRMAs) // Protected - users see their own, admins see all
  .post(protect, createRMA); // Protected - links RMA to authenticated user

router.route("/:id")
  .get(protect, getRMAById) // Protected
  .put(protect, adminOnly, updateRMA) // Admin only
  .delete(protect, adminOnly, deleteRMA); // Admin only

// Status update route (admin only)
router.put("/:id/status", protect, adminOnly, updateRMAStatus);

export default router;
