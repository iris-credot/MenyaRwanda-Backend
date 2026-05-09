const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    const keywords = query
      .toLowerCase()
      .split(" ")
      .filter(word => word.length > 2); // remove small words like "is", "what"

    const docs = await Document.find({
      $or: keywords.map(word => ({
        $or: [
          { title: { $regex: word, $options: "i" } },
          { content: { $regex: word, $options: "i" } }
        ]
      }))
    }).limit(5);

    return docs;
  } catch (error) {
    console.error("retrieveDocs error:", error);
    return [];
  }
};

module.exports = retrieveDocs;