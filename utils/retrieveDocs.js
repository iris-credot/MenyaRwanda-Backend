const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    const keywords = query.toLowerCase().split(" ");

    const docs = await Document.find({
      $or: keywords.map(word => ({
        $or: [
          { title: { $regex: word, $options: "i" } },
          { content: { $regex: word, $options: "i" } }
        ]
      }))
    }).limit(10);

    return docs;
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports = retrieveDocs;