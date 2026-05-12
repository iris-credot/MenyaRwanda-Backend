const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
slug: {type: String, required: true, unique: true}, 
  shortDescription: {
    type: String
  },
fullDescription: {
    type: String
  },
  
 location: {
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distanceFromMainCity: { type: String },
  driveTime: { type: String }
},

contactInfo: {
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String }
  }
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
  tags: [
    {
      type: String
    }
  ],


  atmosphere: {
    type: String,
    enum: [
      'peaceful',
      'romantic',
      'adventurous',
      'family',
      'luxury',
      'nature',
      'cultural',
      'relaxing',
      'nightlife',
      'educational'
    ]
  },


  bestFor: [
    {
      type: String
    }
  ],

  // Example:
  // honeymoon
  // hiking
  // photography
  // wildlife
  // relaxation
  // family trips
  images: [
    {
      type: String
    }
  ],

  

 
  openingHours: {
    type: String, // Example: "9:00 AM - 10:00 PM"
  },
  
  rating: {
    type: Number,
    default: 0
  },


  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
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