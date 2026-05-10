const Document = require("../Models/document");
const Event = require("../Models/events");
const Attraction = require("../Models/attraction");
const Food = require("../Models/foods");
const Review = require("../Models/review");
const Notification = require("../Models/notification");
const Owner = require("../Models/owners");
const model = require("../config/gemini");

const STOP_WORDS = new Set([
  "tell","me","about","what","are","the","is","a","an","and","or","for",
  "in","of","to","how","can","you","i","give","show","list","some","any",
  "all","with","from","that","this","there","do","does","have","has","get",
  "find","know","want","need","please","hi","hello","visit","should","which",
  "places","love","being","near","like","really","very","also","would"
]);

/**
 * Step 1: Use Gemini to extract smart search keywords from user message
 */
const extractSearchKeywords = async (query) => {
  try {
    const prompt = `
You are a search keyword extractor for a Rwanda tourism database.

Given a user's message, extract the most relevant search keywords that would help find matching tourism attractions, events, foods, or activities in Rwanda.

Rules:
- Return ONLY a JSON array of strings, no explanation
- Include synonyms and related terms
- For "water" → include: lake, river, waterfall, swimming, boat, kayak, fishing
- For "hiking" → include: hiking, trekking, trail, climb, volcano, mountain, walk
- For "wildlife" → include: wildlife, safari, animals, gorilla, game drive, park
- For "culture" → include: culture, traditional, dance, village, history, museum
- For "food" → include: food, restaurant, cuisine, eat, local, dish
- Keep to 6-10 keywords maximum
- Return only the JSON array

User message: "${query}"

Return format: ["keyword1", "keyword2", "keyword3"]
`;

    const response = await model.invoke(prompt);
    const text = response.content.trim();

    // Parse JSON array from response
    const match = text.match(/\[.*?\]/s);
    if (match) {
      const keywords = JSON.parse(match[0]);
      console.log("🧠 AI-extracted keywords:", keywords);
      return keywords;
    }
  } catch (err) {
    console.error("⚠️ Keyword extraction failed, falling back:", err.message);
  }

  // Fallback: basic keyword extraction
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
};

/**
 * Step 2: Build flat $or query across keywords × fields
 */
const buildRegexQuery = (fields, keywords) => {
  if (!keywords.length) return {};
  return {
    $or: keywords.flatMap((word) =>
      fields.map((field) => ({
        [field]: { $regex: word, $options: "i" },
      }))
    ),
  };
};

/**
 * Step 3: Intent detection for collection prioritization
 */
const detectIntent = (lowerQuery) => {
  const intents = [];

  const intentMap = [
    {
      type: "attraction",
      signals: [
        "visit","place","attraction","park","lake","mountain","volcano",
        "waterfall","river","hike","hiking","trek","trekking","swim",
        "boat","kayak","gorilla","wildlife","safari","nature","outdoor",
        "water","beach","forest","scenery","landscape","view"
      ],
    },
    {
      type: "event",
      signals: [
        "event","festival","concert","workshop","summit","conference",
        "show","performance","celebration","fair","expo"
      ],
    },
    {
      type: "food",
      signals: [
        "food","eat","restaurant","cuisine","dish","meal","drink",
        "taste","try","local food","hungry","dining"
      ],
    },
    {
      type: "review",
      signals: ["review","rating","feedback","opinion","recommend","experience"],
    },
  ];

  for (const intent of intentMap) {
    if (intent.signals.some((sig) => lowerQuery.includes(sig))) {
      intents.push(intent.type);
    }
  }

  return intents.length ? intents : ["attraction"]; // default to attractions for tourism queries
};

/**
 * MAIN RETRIEVER
 */
const retrieveAllDocs = async (query) => {
  try {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();

    // Step 1: Get smart keywords via Gemini
    const keywords = await extractSearchKeywords(query);

    // Step 2: Detect intent
    const intents = detectIntent(lowerQuery);

    console.log("🔍 Query:", query);
    console.log("🧩 Keywords:", keywords);
    console.log("🎯 Intents:", intents);

    const attractionQ = buildRegexQuery(
      ["name", "description", "location", "district", "province", "category", "tags"],
      keywords
    );

    const eventQ = buildRegexQuery(
      ["title", "description", "location", "category", "tags"],
      keywords
    );

    const foodQ = buildRegexQuery(
      ["name", "description", "category", "tags"],
      keywords
    );

    const reviewQ = buildRegexQuery(
      ["comment"],
      keywords
    );

    const docQ = buildRegexQuery(
      ["title", "content", "category"],
      keywords
    );

    // Run queries — prioritize based on intent
    const isAttractionQuery = intents.includes("attraction");
    const isEventQuery = intents.includes("event");
    const isFoodQuery = intents.includes("food");

    const [docs, events, attractions, foods, reviews] = await Promise.all([
      Document.find(docQ).limit(3).lean(),
      isEventQuery
        ? Event.find(eventQ).limit(6).lean()
        : Event.find(eventQ).limit(2).lean(),
      isAttractionQuery
        ? Attraction.find(attractionQ).limit(8).lean()  // fetch more for attractions
        : Attraction.find(attractionQ).limit(3).lean(),
      isFoodQuery
        ? Food.find(foodQ).limit(6).lean()
        : Food.find(foodQ).limit(2).lean(),
      Review.find(reviewQ).limit(3).lean(),
    ]);

    console.log(
      `📦 Results → docs:${docs.length} events:${events.length} ` +
      `attractions:${attractions.length} foods:${foods.length} reviews:${reviews.length}`
    );

    // Step 3: Format results
    const formatted = [];

    attractions.forEach((a) => {
      if (a.name || a.description)
        formatted.push(
          `[ATTRACTION]\nName: ${a.name || "N/A"}\n` +
          `Description: ${a.description || "N/A"}\n` +
          `Location: ${a.location || a.district || "N/A"}\n` +
          `Category: ${a.category || "N/A"}`
        );
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

    foods.forEach((f) => {
      if (f.name || f.description)
        formatted.push(
          `[FOOD]\nName: ${f.name || "N/A"}\n` +
          `Description: ${f.description || "N/A"}\n` +
          `Category: ${f.category || "N/A"}`
        );
    });

    docs.forEach((d) => {
      if (d.title || d.content)
        formatted.push(`[DOCUMENT]\nTitle: ${d.title || "N/A"}\n${d.content || ""}`);
    });

    reviews.forEach((r) => {
      if (r.comment)
        formatted.push(`[REVIEW]\n${r.comment}`);
    });

    return formatted;

  } catch (error) {
    console.error("❌ RAG Retrieval Error:", error);
    return [];
  }
};

module.exports = retrieveAllDocs;