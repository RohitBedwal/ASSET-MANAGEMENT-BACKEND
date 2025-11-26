import express from "express";
import { createNotification, deleteNotification, getNotifications, getUnreadCount, markAsRead } from "../controllers/notificationController.js";
// import {
//   getNotifications,
//   createNotification,
//   markAsRead,
//   deleteNotification,
//   getUnreadCount
// } from "../controllers/notificationController. js";

const router = express. Router();

// GET /api/notifications - Get all notifications (last 30 days)
router. get("/", getNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get("/unread-count", getUnreadCount);

// POST /api/notifications - Create new notification
router.post("/", createNotification);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", deleteNotification);

export default router;