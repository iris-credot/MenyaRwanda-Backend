const Attraction = require("../Models/attraction");
const Event = require("../Models/events");
const Food = require("../Models/foods");
const Document = require("../Models/document");
const Review = require("../Models/review");

// ── Synonym expansion map ─────────────────────────────────────────────────
// Add more as your content grows
const SYNONYMS = {
  water:    ["lake", "river", "waterfall", "swimming", "boat", "kayak", "fishing", "kivu", "aqua"],
  hiking:   ["hiking", "trekking", "trek", "trail", "climb", "mountain", "volcano", "walk", "summit"],
  wildlife: ["wildlife", "safari", "animal", "gorilla", "game", "park", "bird", "rhino", "lion"],
  culture:  ["culture", "cultural", "traditional", "dance", "village", "history", "museum", "heritage"],
  food:     ["food", "restaurant", "cuisine", "dish", "meal", "local", "taste", "dining"],
  nature:   ["nature", "forest", "scenery", "landscape", "green", "outdoor", "scenic"],
  city:     ["kigali", "city", "urban", "nightlife", "market", "shopping"],
  relax:    ["relax", "peaceful", "quiet", "resort", "spa", "retreat", "scenic"],
};

const STOP_WORDS = new Set([
  "tell","me","about","what","are","the","is","a","an","and","or","for",
  "in","of","to","how","can","you","i","give","show","list","some","any",
  "all","with","from","that","this","there","do","does","have","has","get",
  "find","know","want","need","please","hi","hello","visit","should","which",
  "places","love","being","near","like","really","very","also","would","go",
  "best","great","good","nice","want","looking","interested","suggest","recommend"
]);

/**
 * Expand keywords using synonym map — no AI call needed
 */
const expandKeywords = (query) => {
  const lowerQuery = query.toLowerCase();

  // Start with raw meaningful words from the query
  const rawWords = lowerQuery
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set(rawWords);

  // Add synonyms for any matched concept
  for (const [concept, synonymList] of Object.entries(SYNONYMS)) {
    const conceptMatched =
      lowerQuery.includes(concept) ||
      synonymList.some((s) => lowerQuery.includes(s));

    if (conceptMatched) {
      synonymList.forEach((s) => expanded.add(s));
    }
  }

  const keywords = [...expanded];
  console.log("🧩 Expanded keywords:", keywords);
  return keywords;
};

/**
 * Flat $or query — keywords × fields
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
 * Detect which collections to prioritize
 */
const detectIntent = (lowerQuery) => {
  const intents = [];

  if (/event|festival|concert|workshop|summit|conference|show|fair/.test(lowerQuery))
    intents.push("event");

  if (/food|eat|restaurant|cuisine|dish|meal|drink|taste|hungry|dining/.test(lowerQuery))
    intents.push("food");

  if (/attraction|visit|place|park|lake|mountain|volcano|waterfall|hike|trek|swim|boat|kayak|gorilla|wildlife|safari|nature|outdoor|water|forest|scenery|landscape|view|trail|climb/.test(lowerQuery))
    intents.push("attraction");

  return intents.length ? intents : ["attraction"]; // default for tourism
};

/**
 * MAIN RETRIEVER — single DB round trip, no AI pre-call
 */
const retrieveAllDocs = async (query) => {
  try {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();
    const keywords   = expandKeywords(query);
    const intents    = detectIntent(lowerQuery);

    console.log("🔍 Query:", query);
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
    const docQ = buildRegexQuery(
      ["title", "content", "category"],
      keywords
    );

    const [docs, events, attractions, foods] = await Promise.all([
      Document.find(docQ).limit(3).lean(),
      intents.includes("event")
        ? Event.find(eventQ).limit(6).lean()
        : Event.find(eventQ).limit(2).lean(),
      intents.includes("attraction")
        ? Attraction.find(attractionQ).limit(8).lean()
        : Attraction.find(attractionQ).limit(3).lean(),
      intents.includes("food")
        ? Food.find(foodQ).limit(6).lean()
        : Food.find(foodQ).limit(2).lean(),
    ]);

    console.log(
      `📦 Results → docs:${docs.length} events:${events.length} ` +
      `attractions:${attractions.length} foods:${foods.length}`
    );

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
        formatted.push(
          `[DOCUMENT]\nTitle: ${d.title || "N/A"}\n${d.content || ""}`
        );
    });

    return formatted;

  } catch (error) {
    console.error("❌ RAG Retrieval Error:", error);
    return [];
  }
};

module.exports = retrieveAllDocs;