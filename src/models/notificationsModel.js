import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'expiry', 'device'],
    default: 'info'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: false
  },
  userId: {
    type: mongoose.Schema. Types.ObjectId,
    ref: 'User',
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema. index({ createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;