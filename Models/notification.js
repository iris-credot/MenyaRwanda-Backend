const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: [true, 'Notification message is required']
  },

  type: {
    type: String,
    enum: [
      'account',          // signup, verification, password reset
      'listing_approved', // attraction approved
      'listing_rejected', // attraction rejected
      'review',           // new review on user's listing
      'system'            // general announcements
    ],
    required: true
  },

  read: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);