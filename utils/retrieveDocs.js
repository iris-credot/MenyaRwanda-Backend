const { DynamicStructuredTool } = require("langchain/tools");
const Document = require("../Models/document");

// TOOL = AI can call this automatically
const documentTool = new DynamicStructuredTool({
  name: "search_documents",
  description: "Search internal MongoDB knowledge base for information about Menya Rwanda, system data, FAQs, and projects.",
  func: async (query) => {
    const docs = await Document.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      ]
    }).limit(5);

    return JSON.stringify(docs);
  }
});

module.exports = documentTool;