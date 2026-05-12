const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    attraction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attraction",
    required: true
  },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Traditional", "Street Food", "Snack", "Drink"],
      default: "Traditional",
    },

    image: {
      type: String,
    },
    priceRange: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;