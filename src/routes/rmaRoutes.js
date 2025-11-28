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

// User submission with file upload (no auth required)
router.post("/submit", uploadRMAFiles, submitRMAWithFiles);

// User routes (no auth required for now, can be protected later)
router.get("/my-requests", getMyRMARequests);
router.get("/number/:rmaNumber", getRMAByNumber);

// Admin routes (must be before /:id)
router.get("/admin/pending", protect, adminOnly, getPendingRMAsForAdmin);
router.put("/:id/approve", protect, adminOnly, approveRMA);
router.put("/:id/reject", protect, adminOnly, rejectRMA);
router.post("/:id/upload", protect, adminOnly, uploadRMAAttachment);

// Download attachments (admin only for security)
router.get("/:id/download/:fileType/:index", protect, adminOnly, downloadRMAAttachment);
router.get("/:id/download/:fileType", protect, adminOnly, downloadRMAAttachment);

// Main CRUD routes
router.route("/")
  .get(protect, getRMAs) // Protected - users see their own, admins see all
  .post(createRMA);

router.route("/:id")
  .get(protect, getRMAById) // Protected
  .put(protect, adminOnly, updateRMA) // Admin only
  .delete(protect, adminOnly, deleteRMA); // Admin only

// Status update route (admin only)
router.put("/:id/status", protect, adminOnly, updateRMAStatus);

export default router;
