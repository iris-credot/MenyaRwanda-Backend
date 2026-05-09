const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    const cleanQuery = query.toLowerCase();

    const docs = await Document.find({
      $or: [
        { title: { $regex: cleanQuery, $options: "i" } },
        { content: { $regex: cleanQuery, $options: "i" } }
      ]
    }).limit(10); // increase limit

    return docs;
  } catch (error) {
    console.error("retrieveDocs error:", error);
    return [];
  }
};

module.exports = retrieveDocs;