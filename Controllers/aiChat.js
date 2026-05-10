const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");

const chatWithGemini = async (req, res) => {
  try {
    console.log("AI ROUTE HIT");

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // 🔥 GET DATA FROM ALL MODELS
    const contextArray = await retrieveAllDocs(message);

    console.log("QUERY:", message);
    console.log("FOUND CONTEXT:", contextArray.length);

    const context =
      contextArray.length > 0
        ? contextArray.join("\n\n")
        : "No database information found.";

    // 🧠 FINAL PROMPT (VERY IMPORTANT)
   const prompt = `
You are Menya Rwanda AI assistant.

Use the database context below if relevant.

DATABASE CONTEXT:
${context}

USER QUESTION:
${message}

RULES:
- If database contains relevant information, use it
- If database does not contain answer, use your general knowledge
- Never say only "No database information"
- Answer naturally and helpfully
`;

    const response = await model.invoke(prompt);

    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      sources: contextArray,
    });

  } catch (error) {
    console.error("AI ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { chatWithGemini };