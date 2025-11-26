import Notification from "../models/notificationsModel.js";
import { io } from "../../server.js"; // Import io from server

// Get last 30 days notifications
export const getNotifications = async (req, res) => {
  try {
    const since = new Date();
    since. setDate(since.getDate() - 30);

    const notifications = await Notification. find({
      createdAt: { $gte: since }
    })
    .populate('deviceId', 'name category')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to prevent large responses

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch notifications",
      error: err.message 
    });
  }
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { message, type, deviceId, userId, expiryDate, metadata } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const notification = new Notification({
      message,
      type: type || 'info',
      deviceId,
      userId,
      expiryDate,
      metadata
    });

    await notification.save();

    // Emit real-time notification
    if (type === 'expiry') {
      io.emit('expiry-alert', {
        message,
        expiryDate,
        deviceId,
        notificationId: notification._id
      });
    } else {
      io.emit('notification', {
        message,
        type,
        notificationId: notification._id
      });
    }

    res. status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create notification",
      error: err. message 
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update notification",
      error: err. message 
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500). json({ 
      success: false, 
      message: "Failed to delete notification",
      error: err.message 
    });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get unread count",
      error: err.message 
    });
  }
};