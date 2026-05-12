require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

// Models
//const Accommodation = require("./models/Accommodation");
//const Food = require("./models/Food");
//const Activity = require("./models/Activity");
const Attraction = require("./Models/attraction");
const Event = require("./Models/events");
//const TravelInfo = require("./models/TravelInfo");

// Connect to MongoDB Atlas
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
}

// Load JSON helper
const loadJSON = (file) =>
  JSON.parse(fs.readFileSync(`./data/${file}`, "utf-8"));

async function seed() {
  try {
    await connectDB();

    // Clear old data
    await Attraction.deleteMany();
   // await Accommodation.deleteMany();
   // await Food.deleteMany();
   // await Activity.deleteMany();
    await Event.deleteMany();
   // await TravelInfo.deleteMany();

    console.log("🧹 Old data cleared");

    // Insert Attractions first
    const attractions = await Attraction.insertMany(
      loadJSON("attraction.json")
    );

    console.log("🏞️ Attractions inserted");

    // Map name → ObjectId
    const map = {};
    attractions.forEach((a) => {
      map[a.name] = a._id;
    });

    const replaceAttraction = (items) =>
      items.map((item) => ({
        ...item,
        attraction:
          map[item.attractionName || item.attraction] || item.attraction
      }));

    await Event.insertMany(loadJSON("events.json"));
    // Insert all other collections
    /**
       await Accommodation.insertMany(
      replaceAttraction(loadJSON("accommodations.json"))
    );

    await Food.insertMany(
      replaceAttraction(loadJSON("foods.json"))
    );

    await Activity.insertMany(
      replaceAttraction(loadJSON("activities.json"))
    );


    await TravelInfo.insertMany(
      replaceAttraction(loadJSON("travelinfo.json"))
    );
     */
  

    console.log("🚀 All data seeded successfully into Atlas");

    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seed();