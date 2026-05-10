const Document = require("../Models/document");
const Event = require("../Models/events");
const Attraction = require("../Models/attraction");
const Food = require("../Models/foods");
const Review = require("../Models/review");
const Favorite = require("../Models/favorite");
const Notification = require("../Models/notification");
const Owner = require("../Models/owners");
const User = require("../Models/user");

// Words that carry no search meaning
const STOP_WORDS = new Set([
  "tell", "me", "about", "what", "are", "the", "is", "a", "an",
  "and", "or", "for", "in", "of", "to", "how", "can", "you", "i",
  "give", "show", "list", "some", "any", "all", "with", "from",
  "that", "this", "there", "do", "does", "have", "has", "get",
  "find", "know", "want", "need", "please", "hi", "hello"
]);

// Intent → collection priority map
const INTENT_MAP = [
  {
    keywords: ["event", "events", "festival", "concert", "workshop", "summit", "conference"],
    type: "event",
  },
  {
    keywords: ["attraction", "attractions", "visit", "place", "places", "park", "gorilla", "lake", "mountain", "museum", "site"],
    type: "attraction",
  },
  {
    keywords: ["food", "foods", "eat", "eating", "restaurant", "cuisine", "dish", "meal", "drink"],
    type: "food",
  },
  {
    keywords: ["review", "reviews", "rating", "feedback", "opinion", "comment"],
    type: "review",
  },
  {
    keywords: ["owner", "business", "operator", "partner"],
    type: "owner",
  },
  {
    keywords: ["notification", "notifications", "alert", "update", "news", "announce"],
    type: "notification",
  },
];

/**
 * Detect intent from query → returns array of matched types
 */
const detectIntent = (lowerQuery) => {
  const matched = [];
  for (const intent of INTENT_MAP) {
    if (intent.keywords.some((kw) => lowerQuery.includes(kw))) {
      matched.push(intent.type);
    }
  }
  return matched; // empty = general query
};

/**
 * Build a FLAT $or query across all keywords × all fields
 * Fix: single $or array, not nested $or of $or
 */
const buildRegexQuery = (fields, keywords) => {
  if (!keywords.length) return {}; // match all if no keywords

  return {
    $or: keywords.flatMap((word) =>
      fields.map((field) => ({
        [field]: { $regex: word, $options: "i" },
      }))
    ),
  };
};

/**
 * GLOBAL MULTI-MODEL RAG RETRIEVER
 */
const retrieveAllDocs = async (query) => {
  try {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();

    // Extract meaningful keywords only
    const keywords = lowerQuery
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    // Detect what collections to prioritize
    const intents = detectIntent(lowerQuery);
    const isBroadQuery = keywords.length === 0; // e.g. "tell me about events"

    console.log("🔍 Query:", query);
    console.log("🧩 Keywords:", keywords);
    console.log("🎯 Intents:", intents.length ? intents : ["general"]);
    console.log("📢 Broad query:", isBroadQuery);

    // For intent-based broad queries (e.g. "tell me about events"),
    // fetch all from that collection; otherwise use keyword regex
    const makeQuery = (type, fields) => {
      const isIntended = intents.includes(type);
      if (isIntended && isBroadQuery) return {}; // fetch all in collection
      if (isIntended && keywords.length) return buildRegexQuery(fields, keywords);
      if (!intents.length) return buildRegexQuery(fields, keywords); // general query
      return null; // skip collection not matching intent (use null to skip)
    };

    const eventQ     = makeQuery("event",        ["title", "description", "location"]);
    const attractionQ= makeQuery("attraction",   ["name", "description", "location", "district", "province"]);
    const foodQ      = makeQuery("food",         ["name", "description", "category"]);
    const reviewQ    = makeQuery("review",       ["comment"]);
    const ownerQ     = makeQuery("owner",        ["businessName"]);
    const notifQ     = makeQuery("notification", ["title", "message"]);
    const docQ       = buildRegexQuery(["title", "content", "category"], keywords);

    // Run all queries in parallel; skip collections returning null
    const [
      docs,
      events,
      attractions,
      foods,
      reviews,
      notifications,
      owners,
    ] = await Promise.all([
      docQ       ? Document.find(docQ).limit(4).lean()      : [],
      eventQ     ? Event.find(eventQ).limit(8).lean()       : [],
      attractionQ? Attraction.find(attractionQ).limit(5).lean(): [],
      foodQ      ? Food.find(foodQ).limit(5).lean()         : [],
      reviewQ    ? Review.find(reviewQ).limit(4).lean()     : [],
      notifQ     ? Notification.find(notifQ).limit(3).lean(): [],
      ownerQ     ? Owner.find(ownerQ).limit(3).lean()       : [],
    ]);

    console.log(
      `📦 Results → docs:${docs.length} events:${events.length} ` +
      `attractions:${attractions.length} foods:${foods.length} ` +
      `reviews:${reviews.length} notifs:${notifications.length} owners:${owners.length}`
    );

    // Format results for Gemini context (guard every field)
    const formatted = [];

    docs.forEach((d) => {
      if (d.title || d.content)
        formatted.push(`[DOCUMENT]\nTitle: ${d.title || "N/A"}\n${d.content || ""}`);
    });

    events.forEach((e) => {
      if (e.title || e.description)
        formatted.push(
          `[EVENT]\nName: ${e.title || "N/A"}\n` +
          `Description: ${e.description || "N/A"}\n` +
          `Location: ${e.location || "N/A"}\n` +
          `Date: ${e.date ? new Date(e.date).toDateString() : "N/A"}`
        );
    });

    attractions.forEach((a) => {
      if (a.name || a.description)
        formatted.push(
          `[ATTRACTION]\nName: ${a.name || "N/A"}\n` +
          `Description: ${a.description || "N/A"}\n` +
          `Location: ${a.location || a.district || "N/A"}`
        );
    });

    foods.forEach((f) => {
      if (f.name || f.description)
        formatted.push(
          `[FOOD]\nName: ${f.name || "N/A"}\n` +
          `Description: ${f.description || "N/A"}\n` +
          `Category: ${f.category || "N/A"}`
        );
    });

    reviews.forEach((r) => {
      if (r.comment)
        formatted.push(`[REVIEW]\n${r.comment}`);
    });

    notifications.forEach((n) => {
      if (n.title || n.message)
        formatted.push(`[NOTIFICATION]\n${n.title || "N/A"}: ${n.message || "N/A"}`);
    });

    owners.forEach((o) => {
      if (o.businessName)
        formatted.push(`[BUSINESS]\nName: ${o.businessName}`);
    });

    return formatted;

  } catch (error) {
    console.error("❌ RAG Retrieval Error:", error);
    return [];
  }
};

module.exports = retrieveAllDocs;