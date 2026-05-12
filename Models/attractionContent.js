const mongoose = require("mongoose");

const attractionContentSchema = new mongoose.Schema(
  {
    // Reference to main attraction (e.g., Akagera National Park)
    attraction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attraction",
      required: true,
    },

    // Basic Info
    overview: String,
    bestTimeToVisit: String,
    weather: String,

    // Location details
    location: {
      address: String,
      city: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      distanceFromMainCity: String,
      driveTime: String,
    },

    // Getting there & transport
    gettingThere: String,
    openingHours: String,
    entryFee: String,

    // Visitor guidelines
    visitorTips: [String],
    rules: [String],

    // Highlights & important info
    highlights: [String],
    importantInfo: [String],

    // Statistics (embedded)
    statistics: {
      totalArea: String,
      waterCoverage: String,
      annualVisitors: Number,
    },

   

    // Contact information
    contactInfo: {
      phone: String,
      email: String,
      website: String,
      socialMedia: {
        facebook: String,
        instagram: String,
      },
    },

    // Legacy coordinates (if you want both)
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttractionContent", attractionContentSchema);