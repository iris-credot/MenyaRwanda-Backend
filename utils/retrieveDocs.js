const Attraction = require("../Models/attraction");
const Event = require("../Models/events");
const Food = require("../Models/foods");
const Document = require("../Models/document");
const Review = require("../Models/review");
const Favorite = require("../Models/favorite");
const Owner = require("../Models/owners");
const User = require("../Models/user");

// ── Synonym expansion map ────────────────────────────────────────────────
const SYNONYMS = {
  water:    ["lake", "river", "waterfall", "swimming", "boat", "kayak", "fishing", "kivu", "aqua"],
  hiking:   ["hiking", "trekking", "trek", "trail", "climb", "mountain", "volcano", "walk", "summit"],
  wildlife: ["wildlife", "safari", "animal", "gorilla", "game", "park", "bird", "rhino", "lion"],
  culture:  ["culture", "cultural", "traditional", "dance", "village", "history", "museum", "heritage"],
  food:     ["food", "restaurant", "cuisine", "dish", "meal", "local", "taste", "dining"],
  nature:   ["nature", "forest", "scenery", "landscape", "green", "outdoor", "scenic"],
  city:     ["kigali", "city", "urban", "nightlife", "market", "shopping"],
  relax:    ["relax", "peaceful", "quiet", "resort", "spa", "retreat", "scenic"],
  business: ["business", "owner", "partner", "operator", "company", "service", "provider"],
};

const STOP_WORDS = new Set([
  "tell","me","about","what","are","the","is","a","an","and","or","for",
  "in","of","to","how","can","you","i","give","show","list","some","any",
  "all","with","from","that","this","there","do","does","have","has","get",
  "find","know","want","need","please","hi","hello","visit","should","which",
  "places","love","being","near","like","really","very","also","would","go",
  "best","great","good","nice","want","looking","interested","suggest","recommend"
]);

// ── Keyword expander ─────────────────────────────────────────────────────
const expandKeywords = (query) => {
  const lowerQuery = query.toLowerCase();

  // Split on spaces AND commas to avoid ",which" style tokens
  const rawWords = lowerQuery
    .split(/[\s,]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set(rawWords);

  // Add synonyms for matched concepts
  for (const [concept, synonymList] of Object.entries(SYNONYMS)) {
    const matched =
      lowerQuery.includes(concept) ||
      synonymList.some((s) => lowerQuery.includes(s));

    if (matched) synonymList.forEach((s) => expanded.add(s));
  }

  // Cap at 10 keywords to keep queries fast and context lean
  const keywords = [...expanded].slice(0, 10);
  console.log("🧩 Expanded keywords:", keywords);
  return keywords;
};

// ── Flat $or query builder ───────────────────────────────────────────────
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

// ── Intent detector ──────────────────────────────────────────────────────
const detectIntent = (lowerQuery) => {
  const intents = [];

  if (/event|festival|concert|workshop|summit|conference|show|fair/.test(lowerQuery))
    intents.push("event");

  if (/food|eat|restaurant|cuisine|dish|meal|drink|taste|hungry|dining/.test(lowerQuery))
    intents.push("food");

  if (/attraction|visit|place|park|lake|mountain|volcano|waterfall|hike|trek|swim|boat|kayak|gorilla|wildlife|safari|nature|outdoor|water|forest|scenery|landscape|view|trail|climb/.test(lowerQuery))
    intents.push("attraction");

  if (/owner|business|partner|operator|company|provider|service/.test(lowerQuery))
    intents.push("owner");

  if (/user|people|profile|member|tourist|traveler|visitor/.test(lowerQuery))
    intents.push("user");

  if (/favorite|popular|liked|top|most visited|trending|recommended/.test(lowerQuery))
    intents.push("favorite");

  return intents.length ? intents : ["attraction"];
};

// ── MAIN RETRIEVER ───────────────────────────────────────────────────────
const retrieveAllDocs = async (query) => {
  try {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();
    const keywords   = expandKeywords(query);
    const intents    = detectIntent(lowerQuery);

    console.log("🔍 Query:", query);
    console.log("🎯 Intents:", intents);

    // Build queries
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
    const ownerQ = buildRegexQuery(
      ["businessName"],
      keywords
    );
    const userQ = buildRegexQuery(
      ["username", "names", "firstName", "lastName", "bio", "address"],
      keywords
    );

    // Run all queries in parallel
    const [
      docs,
      events,
      attractions,
      foods,
      reviews,
      owners,
      users,
      favorites,
    ] = await Promise.all([
      Document.find(docQ).limit(2).lean(),

      intents.includes("event")
        ? Event.find(eventQ).limit(3).lean()
        : Event.find(eventQ).limit(1).lean(),

      intents.includes("attraction")
        ? Attraction.find(attractionQ).limit(4).lean()
        : Attraction.find(attractionQ).limit(3).lean(),

      intents.includes("food")
        ? Food.find(foodQ).limit(5).lean()
        : Food.find(foodQ).limit(2).lean(),

      Review.find(buildRegexQuery(["comment"], keywords)).limit(3).lean(),

      intents.includes("owner")
        ? Owner.find(ownerQ).limit(3).lean()
        : Owner.find(ownerQ).limit(1).lean(),

      intents.includes("user")
        ? User.find(userQ)
            .select("username names firstName lastName bio address role")
            .limit(2)
            .lean()
        : [],

      intents.includes("favorite")
        ? Favorite.find({})
            .populate("attractionId", "name description location")
            .limit(10)
            .lean()
        : [],
    ]);

    console.log(
      `📦 Results → docs:${docs.length} events:${events.length} ` +
      `attractions:${attractions.length} foods:${foods.length} ` +
      `reviews:${reviews.length} owners:${owners.length} ` +
      `users:${users.length} favorites:${favorites.length}`
    );

const formatted = [];

// ── helper: natural sentence builder ─────────────────────────
const joinSentence = (...parts) =>
  parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

// ── Attractions (story-style, not database-style) ───────────
attractions.forEach((a) => {
  if (a.name || a.description) {
    formatted.push(
      joinSentence(
        `${a.name || "This place"}`,
        `is a beautiful attraction in`,
        `${a.location || a.district || a.province || "Rwanda"}.`,
        `${a.description || "It is worth visiting for its unique experience."}`,
        a.category ? `It is especially known for ${a.category}.` : ""
      )
    );
  }
});

// ── Events (natural + conversational) ───────────────────────
events.forEach((e) => {
  if (e.title || e.description) {
    formatted.push(
      joinSentence(
        `${e.title || "An event"}`,
        `is happening in`,
        `${e.location || "Rwanda"}`,
        e.date ? `on ${new Date(e.date).toDateString()}.` : ".",
        `${e.description || ""}`
      )
    );
  }
});

// ── Food (descriptive, human tone) ──────────────────────────
foods.forEach((f) => {
  if (f.name || f.description) {
    formatted.push(
      joinSentence(
        `${f.name || "A local dish"}`,
        `is a popular`,
        `${f.category || "Rwandan food"} in Rwanda.`,
        `${f.description || ""}`
      )
    );
  }
});

// ── Documents (clean informational sentence) ────────────────
docs.forEach((d) => {
  if (d.title || d.content) {
    formatted.push(
      joinSentence(
        `${d.title || "Information"}.`,
        `${d.content || ""}`
      )
    );
  }
});

// ── Reviews (human voice preserved) ─────────────────────────
reviews.forEach((r) => {
  if (r.comment) {
    formatted.push(`Visitors often say: "${r.comment}"`);
  }
});

// ── Businesses (soft description, not label-like) ───────────
owners.forEach((o) => {
  if (o.businessName) {
    formatted.push(
      `${o.businessName} is a trusted local business operating in Rwanda.`
    );
  }
});

// ── Users (natural community mention) ───────────────────────
users.forEach((u) => {
  const displayName =
    u.names ||
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    u.username;

  if (displayName) {
    formatted.push(
      joinSentence(
        `${displayName}`,
        `is a community member in Rwanda.`,
        u.bio ? `${u.bio}` : ""
      )
    );
  }
});

// ── Favorites (INSIGHT instead of raw data) ─────────────────
if (favorites.length > 0) {
  const popularityMap = {};

  favorites.forEach((fav) => {
    const attraction = fav.attractionId;
    if (!attraction) return;

    const id = attraction._id?.toString();
    if (!popularityMap[id]) {
      popularityMap[id] = { ...attraction, count: 0 };
    }
    popularityMap[id].count++;
  });

  Object.values(popularityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .forEach((a) => {
      formatted.push(
        `${a.name || "One of the top attractions"} is very popular among visitors in Rwanda, especially loved by ${a.count} people.`
      );
    });
}

    return formatted;

  } catch (error) {
    console.error("❌ RAG Retrieval Error:", error);
    return [];
  }
};

module.exports = retrieveAllDocs;