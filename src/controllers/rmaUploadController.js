import RMA from "../models/rmaModel.js";
import path from "path";
import fs from "fs";

// @desc Create RMA with file uploads
// @route POST /api/rma/submit
export const submitRMAWithFiles = async (req, res) => {
  try {
    const {
      serialNumber,
      invoiceNumber,
      poNumber,
      reason,
      description,
      rmaType,
      issueDescription,
      reportedBy,
      reportedByEmail,
      reportedByPhone,
      priority,
    } = req.body;

    if (!serialNumber) {
      return res.status(400).json({
        message: "Serial number is required",
      });
    }

    // Process uploaded files
    const attachments = {
      photos: [],
      additionalDocs: [],
    };

    if (req.files) {
      // Handle both field-specific and generic 'attachments' field
      const files = req.files.attachments || [];
      
      // Process invoice
      if (req.files.invoice && req.files.invoice[0]) {
        attachments.invoice = {
          filename: req.files.invoice[0].originalname,
          path: req.files.invoice[0].path,
          uploadedAt: new Date(),
        };
      } else if (files.length > 0 && !attachments.invoice) {
        // Use first file as invoice if 'attachments' field is used
        attachments.invoice = {
          filename: files[0].originalname,
          path: files[0].path,
          uploadedAt: new Date(),
        };
      }

      // Process purchase order
      if (req.files.purchaseOrder && req.files.purchaseOrder[0]) {
        attachments.purchaseOrder = {
          filename: req.files.purchaseOrder[0].originalname,
          path: req.files.purchaseOrder[0].path,
          uploadedAt: new Date(),
        };
      }

      // Process photos
      if (req.files.photos && req.files.photos.length > 0) {
        attachments.photos = req.files.photos.map((file) => ({
          filename: file.originalname,
          path: file.path,
          uploadedAt: new Date(),
        }));
      } else if (files.length > 1) {
        // Use remaining files as photos if 'attachments' field is used
        attachments.photos = files.slice(1).map((file) => ({
          filename: file.originalname,
          path: file.path,
          uploadedAt: new Date(),
        }));
      }

      // Process additional documents
      if (req.files.additionalDocs && req.files.additionalDocs.length > 0) {
        attachments.additionalDocs = req.files.additionalDocs.map((file) => ({
          filename: file.originalname,
          path: file.path,
          description: req.body.docDescriptions || "",
          uploadedAt: new Date(),
        }));
      }
    }

    // Try to find device by serial number
    const Device = (await import("../models/deviceModel.js")).default;
    let deviceId = null;
    const device = await Device.findOne({ serial: serialNumber });
    if (device) {
      deviceId = device._id;
    }

    // Create RMA
    const rma = await RMA.create({
      serialNumber,
      invoiceNumber,
      poNumber,
      reason,
      description,
      deviceId,
      rmaType: rmaType || "repair",
      issueDescription: issueDescription || description || reason || "Issue reported",
      reportedBy: reportedBy || "User",
      reportedByEmail,
      reportedByPhone,
      priority: priority || "medium",
      attachments,
      status: "pending_review",
      isNewSubmission: true,
      statusHistory: [
        {
          status: "pending_review",
          updatedBy: reportedBy || "User",
          notes: "RMA submitted by user with attachments",
        },
      ],
    });

    // Populate the created RMA
    const populatedRma = await RMA.findById(rma._id)
      .populate("deviceId")
      .populate("vendorId")
      .populate("replacementDeviceId");

    // Emit real-time notification to admins
    const { io } = await import("../../server.js");
    io.emit("notification", {
      title: "New RMA Submission",
      message: `RMA ${rma.rmaNumber} submitted for serial: ${serialNumber}`,
      type: "rma_created",
      rmaId: rma._id,
      priority: rma.priority,
      timestamp: new Date().toISOString(),
    });

    io.emit("admin:newRMA", {
      rmaNumber: rma.rmaNumber,
      serialNumber,
      reportedBy,
      priority: rma.priority,
      hasAttachments: Object.keys(attachments).some(
        (key) => attachments[key] && attachments[key].length > 0
      ),
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "RMA submitted successfully. Admin will review your request.",
      rma: populatedRma,
    });
  } catch (error) {
    console.error("Submit RMA Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get RMA attachment file
// @route GET /api/rma/:id/download/:fileType/:index?
export const downloadRMAAttachment = async (req, res) => {
  try {
    const { id, fileType, index } = req.params;

    let query = { _id: id };
    
    // If user is not admin, only allow access to their own RMA attachments
    if (req.user && req.user.role !== 'admin') {
      query = {
        _id: id,
        $or: [
          { reportedByEmail: req.user.email },
          { reportedBy: req.user.name }
        ]
      };
    }

    const rma = await RMA.findOne(query);
    if (!rma) {
      return res.status(404).json({ message: "RMA not found or access denied" });
    }

    let filePath;

    if (fileType === "invoice" && rma.attachments.invoice) {
      filePath = rma.attachments.invoice.path;
    } else if (fileType === "purchaseOrder" && rma.attachments.purchaseOrder) {
      filePath = rma.attachments.purchaseOrder.path;
    } else if (fileType === "photo" && index !== undefined) {
      const photoIndex = parseInt(index);
      if (rma.attachments.photos[photoIndex]) {
        filePath = rma.attachments.photos[photoIndex].path;
      }
    } else if (fileType === "additional" && index !== undefined) {
      const docIndex = parseInt(index);
      if (rma.attachments.additionalDocs[docIndex]) {
        filePath = rma.attachments.additionalDocs[docIndex].path;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("Download Attachment Error:", error);
    res.status(500).json({ message: error.message });
  }
};
