import RMA from "../models/rmaModel.js";
import Device from "../models/deviceModel.js";
import { io } from "../../server.js";

// @desc Create new RMA (User submission with attachments)
// @route POST /api/rma
export const createRMA = async (req, res) => {
  try {
    const {
      serialNumber,
      rmaType,
      issueDescription,
      reportedBy,
      reportedByEmail,
      reportedByPhone,
      priority,
      attachments,
    } = req.body;

    console.log("🔍 Debug createRMA:");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    if (!serialNumber || !rmaType || !issueDescription) {
      return res.status(400).json({
        message: "Serial number, RMA type, and issue description are required",
      });
    }

    // If user is authenticated, use their info automatically
    let finalReportedBy = reportedBy;
    let finalReportedByEmail = reportedByEmail;
    
    if (req.user) {
      finalReportedBy = req.user.name || reportedBy;
      finalReportedByEmail = req.user.email || reportedByEmail;
    }

    console.log("🔍 Final user data for RMA:");
    console.log("finalReportedBy:", finalReportedBy);
    console.log("finalReportedByEmail:", finalReportedByEmail);

    // Ensure we have at least a reporter name
    if (!finalReportedBy) {
      return res.status(400).json({
        message: "Reporter name is required",
      });
    }

    // Try to find device by serial number (optional - admin can link later)
    let deviceId = null;
    const device = await Device.findOne({ serial: serialNumber });
    if (device) {
      deviceId = device._id;
    }

    // Create RMA with user-submitted data
    const rma = await RMA.create({
      serialNumber,
      deviceId, // May be null if device not found
      rmaType,
      issueDescription,
      reportedBy: finalReportedBy,
      reportedByEmail: finalReportedByEmail,
      reportedByPhone,
      priority: priority || "medium",
      attachments: attachments || {},
      status: "pending_review",
      isNewSubmission: true,
      statusHistory: [
        {
          status: "pending_review",
          updatedBy: finalReportedBy,
          notes: "RMA submitted by user",
        },
      ],
    });

    console.log("🔍 Created RMA:", {
      rmaNumber: rma.rmaNumber,
      reportedBy: rma.reportedBy,
      reportedByEmail: rma.reportedByEmail
    });

    // Populate the created RMA
    const populatedRma = await RMA.findById(rma._id)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    // Emit real-time notification to admins
    io.emit("notification", {
      title: "New RMA Submission",
      message: `RMA ${rma.rmaNumber} submitted for serial: ${serialNumber}`,
      type: "rma_created",
      rmaId: rma._id,
      priority: rma.priority,
      timestamp: new Date().toISOString(),
    });

    // Also emit to admin-specific channel
    io.emit("admin:newRMA", {
      rmaNumber: rma.rmaNumber,
      serialNumber,
      reportedBy: finalReportedBy,
      priority: rma.priority,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: "RMA submitted successfully. You will be notified once reviewed by admin.",
      rma: populatedRma,
    });
  } catch (error) {
    console.error("Create RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all RMAs with optional filters
// @route GET /api/rma
export const getRMAs = async (req, res) => {
  try {
    const { status, priority, rmaType, deviceId } = req.query;

    let query = {};
    
    // If user is not admin, only show their own RMAs
    if (req.user && req.user.role !== 'admin') {
      query.$or = [
        { reportedByEmail: req.user.email },
        { reportedBy: req.user.name }
      ];
    }
    
    // Apply additional filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (rmaType) query.rmaType = rmaType;
    if (deviceId) query.deviceId = deviceId;

    const rmas = await RMA.find(query)
      .populate({
        path: "deviceId",
        populate: { path: "categoryId", select: "name" },
      })
      .populate("vendorId")
      .populate("replacementDeviceId")
      .sort({ createdAt: -1 });

    res.json(rmas);
  } catch (error) {
    console.error("Get RMAs Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get RMA by ID
// @route GET /api/rma/:id
export const getRMAById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If user is not admin, only allow access to their own RMAs
    if (req.user && req.user.role !== 'admin') {
      query = {
        _id: req.params.id,
        $or: [
          { reportedByEmail: req.user.email },
          { reportedBy: req.user.name }
        ]
      };
    }

    const rma = await RMA.findOne(query)
      .populate({
        path: "deviceId",
        populate: { path: "categoryId", select: "name" },
      })
      .populate("vendorId")
      .populate("replacementDeviceId");

    if (!rma) {
      return res.status(404).json({ message: "RMA not found or access denied" });
    }

    res.json(rma);
  } catch (error) {
    console.error("Get RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Update RMA status
// @route PUT /api/rma/:id/status
export const updateRMAStatus = async (req, res) => {
  try {
    const { status, updatedBy, notes } = req.body;

    if (!status || !updatedBy) {
      return res.status(400).json({
        message: "Status and updatedBy are required",
      });
    }

    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    // Update status
    rma.status = status;
    rma.statusHistory.push({
      status,
      updatedBy,
      notes,
    });

    // Update specific date fields based on status
    if (status === "approved") {
      rma.approvedBy = updatedBy;
      rma.approvedDate = new Date();
    } else if (status === "completed") {
      rma.completedDate = new Date();
      if (!rma.actualReturnDate) {
        rma.actualReturnDate = new Date();
      }
    }

    await rma.save();

    const populatedRma = await RMA.findById(rma._id)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    // Emit real-time notification
    io.emit("notification", {
      title: "RMA Status Updated",
      message: `RMA ${rma.rmaNumber} status changed to ${status}`,
      type: "rma_status_updated",
      timestamp: new Date().toISOString(),
    });

    res.json(populatedRma);
  } catch (error) {
    console.error("Update RMA Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Update RMA details
// @route PUT /api/rma/:id
export const updateRMA = async (req, res) => {
  try {
    const updates = req.body;

    // Don't allow direct status updates through this endpoint
    delete updates.status;
    delete updates.statusHistory;

    const rma = await RMA.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    res.json(rma);
  } catch (error) {
    console.error("Update RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete RMA
// @route DELETE /api/rma/:id
export const deleteRMA = async (req, res) => {
  try {
    const rma = await RMA.findByIdAndDelete(req.params.id);

    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    res.json({ message: "RMA deleted successfully" });
  } catch (error) {
    console.error("Delete RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get pending RMAs for admin review
// @route GET /api/rma/admin/pending
export const getPendingRMAsForAdmin = async (req, res) => {
  try {
    const pendingRMAs = await RMA.find({ status: "pending_review" })
      .populate("deviceId")
      .populate("vendorId")
      .sort({ createdAt: -1 });

    res.json({
      count: pendingRMAs.length,
      rmas: pendingRMAs,
    });
  } catch (error) {
    console.error("Get Pending RMAs Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get user's own RMA requests
// @route GET /api/rma/my-requests
export const getMyRMARequests = async (req, res) => {
  try {
    const { email, phone, serialNumber } = req.query;

    // Build query to show only user's own RMAs
    let query = {};
    
    // Debug: Log user info
    console.log("🔍 Debug getMyRMARequests:");
    console.log("req.user:", req.user);
    console.log("Query params:", { email, phone, serialNumber });
    
    // If user is authenticated, filter by their info
    if (req.user) {
      // More flexible matching for user RMAs
      query.$or = [
        { reportedByEmail: req.user.email },
        { reportedBy: req.user.name },
        { reportedBy: req.user.email }, // Sometimes name field contains email
        { reportedByEmail: req.user.name } // Edge case
      ];
      
      console.log("🔍 Auth user query:", JSON.stringify(query, null, 2));
    } else {
      // If not authenticated, require at least one filter for privacy
      if (!email && !phone && !serialNumber) {
        return res.status(400).json({
          message: "Please provide email, phone, or serialNumber to fetch your RMAs",
        });
      }
      
      if (email) query.reportedByEmail = email;
      if (phone) query.reportedByPhone = phone;
      if (serialNumber) query.serialNumber = serialNumber;
      
      console.log("🔍 Non-auth query:", JSON.stringify(query, null, 2));
    }

    // Debug: Check what RMAs exist
    const allUserRMAs = await RMA.find({}).select('reportedBy reportedByEmail serialNumber rmaNumber').lean();
    console.log("🔍 All RMAs in DB:", allUserRMAs);

    const rmas = await RMA.find(query)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId")
      .sort({ createdAt: -1 })
      .limit(50);

    console.log("🔍 Filtered RMAs found:", rmas.length);

    res.json({
      count: rmas.length,
      rmas: rmas,
    });
  } catch (error) {
    console.error("Get My RMAs Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get RMA by RMA Number
// @route GET /api/rma/number/:rmaNumber
export const getRMAByNumber = async (req, res) => {
  try {
    let query = { rmaNumber: req.params.rmaNumber };
    
    // If user is not admin, only allow access to their own RMAs
    if (req.user && req.user.role !== 'admin') {
      query.$and = [
        { rmaNumber: req.params.rmaNumber },
        {
          $or: [
            { reportedByEmail: req.user.email },
            { reportedBy: req.user.name }
          ]
        }
      ];
    }

    const rma = await RMA.findOne(query)
      .populate({
        path: "deviceId",
        populate: { path: "categoryId", select: "name" },
      })
      .populate("vendorId")
      .populate("replacementDeviceId");

    if (!rma) {
      return res.status(404).json({ message: "RMA not found or access denied" });
    }

    res.json(rma);
  } catch (error) {
    console.error("Get RMA by Number Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin approve RMA
// @route PUT /api/rma/:id/approve
export const approveRMA = async (req, res) => {
  try {
    const { approvedBy, notes, vendorId, estimatedReturnDate } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ message: "Approver name is required" });
    }

    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    // Update RMA
    rma.status = "approved";
    rma.approvedBy = approvedBy;
    rma.approvedDate = new Date();
    rma.reviewedBy = approvedBy;
    rma.reviewedDate = new Date();
    rma.isNewSubmission = false;

    if (vendorId) rma.vendorId = vendorId;
    if (estimatedReturnDate) rma.estimatedReturnDate = estimatedReturnDate;

    rma.statusHistory.push({
      status: "approved",
      updatedBy: approvedBy,
      notes: notes || "RMA approved by admin",
    });

    await rma.save();

    const populatedRma = await RMA.findById(rma._id)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    // Notify user about approval
    io.emit("notification", {
      title: "RMA Approved",
      message: `RMA ${rma.rmaNumber} has been approved`,
      type: "rma_approved",
      rmaId: rma._id,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "RMA approved successfully",
      rma: populatedRma,
    });
  } catch (error) {
    console.error("Approve RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin reject RMA
// @route PUT /api/rma/:id/reject
export const rejectRMA = async (req, res) => {
  try {
    const { rejectedBy, rejectionReason } = req.body;

    if (!rejectedBy || !rejectionReason) {
      return res.status(400).json({
        message: "Rejector name and rejection reason are required",
      });
    }

    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    // Update RMA
    rma.status = "rejected";
    rma.rejectionReason = rejectionReason;
    rma.reviewedBy = rejectedBy;
    rma.reviewedDate = new Date();
    rma.isNewSubmission = false;

    rma.statusHistory.push({
      status: "rejected",
      updatedBy: rejectedBy,
      notes: rejectionReason,
    });

    await rma.save();

    const populatedRma = await RMA.findById(rma._id)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    // Notify user about rejection
    io.emit("notification", {
      title: "RMA Rejected",
      message: `RMA ${rma.rmaNumber} has been rejected`,
      type: "rma_rejected",
      rmaId: rma._id,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "RMA rejected",
      rma: populatedRma,
    });
  } catch (error) {
    console.error("Reject RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Upload RMA attachment
// @route POST /api/rma/:id/upload
export const uploadRMAAttachment = async (req, res) => {
  try {
    const { attachmentType, filename, path, description } = req.body;

    if (!attachmentType || !filename || !path) {
      return res.status(400).json({
        message: "Attachment type, filename, and path are required",
      });
    }

    const rma = await RMA.findById(req.params.id);
    if (!rma) {
      return res.status(404).json({ message: "RMA not found" });
    }

    const uploadData = {
      filename,
      path,
      uploadedAt: new Date(),
    };

    // Update attachments based on type
    if (attachmentType === "invoice") {
      rma.attachments.invoice = uploadData;
    } else if (attachmentType === "purchaseOrder") {
      rma.attachments.purchaseOrder = uploadData;
    } else if (attachmentType === "photo") {
      rma.attachments.photos.push(uploadData);
    } else if (attachmentType === "additional") {
      rma.attachments.additionalDocs.push({
        ...uploadData,
        description: description || "",
      });
    } else {
      return res.status(400).json({ message: "Invalid attachment type" });
    }

    await rma.save();

    res.json({
      success: true,
      message: "Attachment uploaded successfully",
      attachments: rma.attachments,
    });
  } catch (error) {
    console.error("Upload Attachment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Debug endpoint to check user and RMA data
// @route GET /api/rma/debug/user-info
export const debugUserInfo = async (req, res) => {
  try {
    console.log("🔍 Debug User Info:");
    console.log("req.user:", req.user);
    
    // Get all RMAs to see what data exists
    const allRMAs = await RMA.find({}).select('reportedBy reportedByEmail serialNumber rmaNumber createdAt').lean();
    
    res.json({
      user: req.user,
      allRMAs: allRMAs,
      totalRMACount: allRMAs.length
    });
  } catch (error) {
    console.error("Debug User Info Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get RMA statistics
// @route GET /api/rma/stats/overview
export const getRMAStats = async (req, res) => {
  try {
    const totalRMAs = await RMA.countDocuments();
    const pendingRMAs = await RMA.countDocuments({ status: "pending_review" });
    const inProgressRMAs = await RMA.countDocuments({
      status: {
        $in: [
          "approved",
          "in_transit_to_vendor",
          "received_by_vendor",
          "under_repair",
          "repaired",
          "replaced",
          "in_transit_to_client",
        ],
      },
    });
    const completedRMAs = await RMA.countDocuments({ status: "completed" });
    const rejectedRMAs = await RMA.countDocuments({ status: "rejected" });

    const rmasByType = await RMA.aggregate([
      { $group: { _id: "$rmaType", count: { $sum: 1 } } },
    ]);

    const rmasByPriority = await RMA.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const avgRepairCost = await RMA.aggregate([
      { $match: { repairCost: { $gt: 0 } } },
      { $group: { _id: null, avgCost: { $avg: "$repairCost" } } },
    ]);

    // New submissions count
    const newSubmissions = await RMA.countDocuments({ isNewSubmission: true });

    res.json({
      totalRMAs,
      pendingRMAs,
      newSubmissions,
      inProgressRMAs,
      completedRMAs,
      rejectedRMAs,
      rmasByType,
      rmasByPriority,
      avgRepairCost: avgRepairCost[0]?.avgCost || 0,
    });
  } catch (error) {
    console.error("Get RMA Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};
