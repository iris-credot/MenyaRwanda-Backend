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
You are Menya Rwanda AI assistant.

Always check database context first.

DATABASE CONTENT:
${context}

QUESTION:
${message}

RULES:
- If DB content exists, you MUST use it
- If no DB content, say "No relevant database info found"
- Always explain whether DB was used or not
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