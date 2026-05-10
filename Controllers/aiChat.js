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
  ? docs.map(d => d.content.substring(0, 500)).join("\n")
  : "No database information.";

    // 2. BUILD PROMPT
 const prompt = `
You are Menya Rwanda AI assistant.

Use the database context below to answer the user question.

DATABASE:
${context}

QUESTION:
${message}

Answer briefly and clearly.
`;

    // 3. CALL GEMINI
  const response = await Promise.race([
  model.invoke(prompt),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini timeout")), 15000)
  )
]);
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