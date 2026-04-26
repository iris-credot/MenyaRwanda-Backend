const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  attractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction',
    required: true
  }

}, { timestamps: true });


// ❗ Prevent duplicate favorites (VERY IMPORTANT)
favoriteSchema.index({ user: 1, attractionId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);