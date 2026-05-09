const Document = require("../Models/document");

/**
 * Retrieve relevant documents from MongoDB for RAG
 * Uses fallback regex search to avoid $text limitations
 */
const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    // Clean query (helps matching)
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .trim();

    // Flexible search (better than $text for beginners)
    const docs = await Document.find({
      $or: [
        { title: { $regex: cleanQuery, $options: "i" } },
        { content: { $regex: cleanQuery, $options: "i" } }
      ]
    }).limit(5);

    return docs;
  } catch (error) {
    console.error("retrieveDocs error:", error);
    return [];
  }
};

module.exports = retrieveDocs;