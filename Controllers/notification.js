const Notification = require('../Models/notification');
const asyncWrapper = require('../Middleware/async');
const BadRequest = require('../Error/BadRequest');
const NotFound = require('../Error/NotFound');
const User = require('../Models/user');


// ===============================
// 🔹 CREATE SINGLE NOTIFICATION
// ===============================
const notificationController= {
 createNotification :async ({ user, title, message, type }) => {
  try {
    if (!user || !title || !message || !type) {
      console.warn('Notification skipped: missing fields');
      return;
    }

    const userExists = await User.findById(user);
    if (!userExists) {
      console.warn(`User ${user} not found`);
      return;
    }

    const notification = await Notification.create({
      user,
      title,
      message,
      type
    });

    return notification;

  } catch (error) {
    console.error('Error creating notification:', error);
  }
},


// ===============================
// 🔹 CREATE SYSTEM NOTIFICATION (BROADCAST)
// ===============================
 createSystemNotification : async ({ title, message }) => {
  try {
    if (!title || !message) return;

    const users = await User.find().select('_id');

    const notifications = users.map(u => ({
      user: u._id,
      title,
      message,
      type: 'system'
    }));

    await Notification.insertMany(notifications);

  } catch (error) {
    console.error('System notification error:', error);
  }
},


// ===============================
// 🔹 GET ALL (ADMIN)
// ===============================
 getAllNotifications : asyncWrapper(async (req, res) => {
  const notifications = await Notification.find()
    .populate('user', 'username email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
}),


// ===============================
// 🔹 GET MY NOTIFICATIONS
// ===============================
getMyNotifications :asyncWrapper(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
}),


// ===============================
// 🔹 MARK AS READ (ONE)
// ===============================
markAsRead : asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return next(new NotFound('Notification not found'));
  }

  // Security check
  if (notification.user.toString() !== req.user.id) {
    return next(new BadRequest('Not authorized'));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
}),


// ===============================
// 🔹 MARK ALL AS READ
// ===============================
 markAllAsRead : asyncWrapper(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
}),


// ===============================
// 🔹 DELETE NOTIFICATION
// ===============================
 deleteNotification : asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return next(new NotFound('Notification not found'));
  }

  if (notification.user.toString() !== req.user.id) {
    return next(new BadRequest('Not authorized'));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
}),


// ===============================
// 🔹 GET BY TYPE (OPTIONAL FILTER)
// ===============================
 getByType : asyncWrapper(async (req, res) => {
  const { type } = req.params;

  const notifications = await Notification.find({
    user: req.user.id,
    type
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
})
}


// ===============================
// 🔹 EXPORT
// ===============================
module.exports = notificationController;