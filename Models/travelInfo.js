const mongoose = require("mongoose");


const travelInfoSchema = new mongoose.Schema(
  {
    // Reference to parent attraction (one-to-one)
    attraction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attraction",
      required: [true, "Attraction ID is required"],
      unique: true, // ensures only one travel info document per attraction
      
    },

    // Location & distance
    nearestCity: {
      type: String,
      trim: true,
      required: [true, "Nearest city is required"],
    },

    distanceFromKigali: {
      type: String,
      trim: true,
      example: "110 km (2 hours drive)",
    },

    // Transport
    transportOptions: [
      {
        type: String,
        trim: true,
      },
    ],

  
    emergencyContacts: [
      {
        type: String,
        trim: true,
      },
    ],


    accessibility: {
      type: String,
      trim: true,
      description: "Wheelchair access, special needs, etc.",
    },

    recommendedStayDuration: {
      type: String,
      trim: true,
      example: "2-3 days",
    },

   
    tips: [
      {
        type: String,
        trim: true,
      },
    ],

   
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

travelInfoSchema.index({ attraction: 1 });


travelInfoSchema.set("toJSON", { virtuals: true });
travelInfoSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("TravelInfo", travelInfoSchema);