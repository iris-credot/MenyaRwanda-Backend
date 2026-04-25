const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  location: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: [
      'national_park',
      'mountain',
      'lake',
      'waterfall',
      'forest',
      'museum',
      'cultural_site',
      'historical_site',
      'memorial',
      'hotel',
      'restaurant',
      'city_attraction',
      'viewpoint',
      'resort',
      'park',
      'other'
    ],
    required: true
  },

  images: [
    {
      type: String
    }
  ],
 phone: {
    type: String,
 
  },

  email: {
    type: String,
  },
  openingHours: {
    type: String, // Example: "9:00 AM - 10:00 PM"
  },
  
  rating: {
    type: Number,
    default: 0
  },


  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }

}, { timestamps: true });

module.exports = mongoose.model('Attraction', attractionSchema);