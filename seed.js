require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

console.log("MONGO_URI =", process.env.MONGODB_URI);

// Models
const Attraction = require("./Models/attractionContent");
// const Event = require("./Models/events");

const Accommodation = require("./Models/accomodations");
const Food = require("./Models/foods");
const Activity = require("./Models/activities");
const TravelInfo = require("./Models/travelInfo");

// Connect to MongoDB Atlas
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
}

// Safe JSON loader
const loadJSON = (file) => {
  try {
    const data = fs.readFileSync(`./data/${file}`, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ JSON ERROR in file: ${file}`);
    throw err;
  }
};

// Replace attraction names with real MongoDB ObjectIds
function replaceAttraction(data, map) {
  return data.map((item) => {
    // keep existing valid ObjectId
    if (
      typeof item.attraction === "string" &&
      mongoose.Types.ObjectId.isValid(item.attraction.trim())
    ) {
      return {
        ...item,
        attraction: item.attraction.trim(),
      };
    }

    // replace attraction name with mapped ObjectId
    return {
      ...item,
      attraction: map[item.attraction] || item.attraction,
    };
  });
}

async function seed() {
  try {
    await connectDB();

    // Clear old data
    await Attraction.deleteMany();
    await Accommodation.deleteMany();
    await Food.deleteMany();
    await Activity.deleteMany();
    await TravelInfo.deleteMany();

    console.log("🧹 Old data cleared");

    // Load attractions first
    const attractionsData = loadJSON("attractionContent.json");

    const attractions = await Attraction.insertMany(attractionsData);

    console.log("🏞️ Attractions inserted");

    // Create attraction name -> ObjectId map
    const map = {};

    attractions.forEach((a) => {
      map[a.name] = a._id.toString();
    });

    // Insert accommodations
    await Accommodation.insertMany(
      replaceAttraction(loadJSON("accomodations.json"), map)
    );

    console.log("🏨 Accommodations inserted");

    // Insert foods
    await Food.insertMany(
      replaceAttraction(loadJSON("foods.json"), map)
    );

    console.log("🍽️ Foods inserted");

    // Insert activities
    await Activity.insertMany(
      replaceAttraction(loadJSON("activities.json"), map)
    );

    console.log("🎯 Activities inserted");

    // Insert travel info
    await TravelInfo.insertMany(
      replaceAttraction(loadJSON("travelinfo.json"), map)
    );

    console.log("🧳 Travel info inserted");

    console.log("🚀 All data seeded successfully into Atlas");

    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();