const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    const words = query
      .toLowerCase()
      .split(" ")
      .filter(w => w.length > 2);

    const docs = await Document.find({
      $or: words.map(word => ({
        $or: [
          { title: { $regex: word, $options: "i" } },
          { content: { $regex: word, $options: "i" } },
          { category: { $regex: word, $options: "i" } }
        ]
      }))
    }).limit(10);

    return docs;
  } catch (err) {
    console.error("retrieve error:", err);
    return [];
  }
};

module.exports = retrieveDocs;