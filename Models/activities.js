const mongoose = require("mongoose");


const activitySchema = new mongoose.Schema(
  {
    // Reference to parent attraction
    attraction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attraction",
      required: [true, "Attraction ID is required"],
      index: true,
    },

    // Basic information
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    image: {
      type: String,
      trim: true,
    },

    // Time & cost
    duration: {
      type: String,
      trim: true,
      example: "3-4 hours",
    },

    price: {
      type: String,
      trim: true,
      example: "$50 per person",
    },

    availability: {
      type: String,
      trim: true,
      example: "Daily, 6am - 6pm",
    },

    // Categorization
    category: {
      type: String,
      enum: {
        values: [
          "safari",
          "boat_trip",
          "hiking",
          "cultural",
          "night_drive",
          "walking_safari",
          "fishing",
          "bird_watching",
          "photography",
          "other",
        ],
        message: "{VALUE} is not a valid activity category",
      },
      required: [true, "Category is required"],
    },

    // Optional: additional details
    includes: [String],      // e.g., ["guide", "park fees", "water"]
    schedule: String,        // e.g., "Morning: 7am, Afternoon: 2pm"
    minPeople: {
      type: Number,
      min: 1,
      default: 1,
    },
    maxPeople: {
      type: Number,
      min: 1,
    },
  },
  { timestamps: true }
);

// Index for efficient queries by attraction + category
activitySchema.index({ attraction: 1, category: 1 });

// Virtual for formatted price (if needed)
activitySchema.virtual("formattedPrice").get(function () {
  return this.price ? this.price : "Contact for pricing";
});

// Ensure virtuals are included in JSON output
activitySchema.set("toJSON", { virtuals: true });
activitySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Activity", activitySchema);