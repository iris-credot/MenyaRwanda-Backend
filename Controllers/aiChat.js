const model = require("../config/gemini");
const retrieveDocs = require("../utils/retrieveDocs"); // 👈 NEW

const chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // 1. Retrieve relevant documents from MongoDB
    const docs = await retrieveDocs(message);

    // 2. Build context from DB results
    const context = docs
      .map((doc) => `${doc.title}\n${doc.content}`)
      .join("\n\n");

    // 3. RAG Prompt (most important part)
    const prompt = `
You are a helpful assistant. Use the context below to answer the user.

If the context does not contain the answer, say you don't know.

Context:
${context || "No relevant data found in database."}

User Question:
${message}
`;

    // 4. Send to Gemini
    const response = await model.invoke(prompt);

    // 5. Return response + debug info
    res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      sources: docs, // optional: show retrieved DB data
    });
  } catch (error) {
    console.error("RAG Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithGemini,
};