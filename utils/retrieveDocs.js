const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  try {
    if (!query) return [];

    const docs = await Document.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      ]
    }).limit(5);

    return docs;
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports = retrieveDocs;