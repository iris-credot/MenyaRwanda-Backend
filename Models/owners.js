const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  businessName: {
    type: String,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);