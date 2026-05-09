const Document = require("../Models/document");

const retrieveDocs = async (query) => {
  // Simple text search (you can improve later with vector DB)
  const docs = await Document.find({
    $text: { $search: query },
  }).limit(5);

  return docs;
};

module.exports = retrieveDocs;