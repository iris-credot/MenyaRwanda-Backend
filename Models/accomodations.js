const mongoose = require("mongoose");

const accommodationSchema = new mongoose.Schema(
  {
    attraction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attraction",
      required: true,
      index: true, // improves query performance
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["hotel", "lodge", "camp", "resort", "guesthouse"],
      required: true,
    },

    images: [{
      type: String
    }],

    amenities: [String],

    priceRange: {
      type: String,
      trim: true,
    },

    contact: {
      phone: String,
      email: String,
      website: String,
    },

    location: {
      type: String,
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Optional: virtual for average rating from reviews (if you have a review model for accommodations)
// accommodationSchema.virtual('avgRating').get(function() {
//   return this.rating;
// });

module.exports = mongoose.model("Accommodation", accommodationSchema);