const model = require("../config/gemini");
const retrieveDocs = require("../utils/retrieveDocs");

const chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // 1. GET CONTEXT FROM DB
    const docs = await retrieveDocs(message);

    const context = docs.length
      ? docs.map(d => d.content).join("\n")
      : "No relevant database information found.";

    // 2. BUILD PROMPT
  const prompt = `
You are an AI assistant for Menya Rwanda project.

You MUST follow these rules:

1. If context is provided, ALWAYS use it in your answer.
2. Never ignore database context.
3. If context is empty, say you don't have database info.

Context from database:
${context}

User question:
${message}

Answer using BOTH:
- database context (if available)
- your general knowledge (only to explain better, not replace DB)
`;

    // 3. CALL GEMINI
    const response = await model.invoke(prompt);
console.log("QUERY:", message);
console.log("FOUND DOCS:", docs);
    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      sources: docs,
    });

  } catch (error) {
    console.error("AI Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { chatWithGemini };