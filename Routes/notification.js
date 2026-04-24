const express = require('express');
const router = express.Router();

const notificationController = require('../Controllers/notification');
const auth = require('../Middleware/authentication');


// 🔐 ADMIN ROUTES

// Get all notifications (admin only)
router.get(
  '/',
  auth.adminJWT,
  notificationController.getAllNotifications
);


// 🔐 USER ROUTES

// Get my notifications
router.get(
  '/me',
  auth.AuthJWT,
  notificationController.getMyNotifications
);

// Get notifications by type (account, review, system, etc.)
router.get(
  '/type/:type',
  auth.AuthJWT,
  notificationController.getByType
);

// Mark one as read
router.patch(
  '/:id/read',
  auth.AuthJWT,
  notificationController.markAsRead
);

// Mark all as read
router.patch(
  '/read-all',
  auth.AuthJWT,
  notificationController.markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  auth.AuthJWT,
  notificationController.deleteNotification
);

module.exports = router;