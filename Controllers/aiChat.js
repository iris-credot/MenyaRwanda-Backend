const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");

const chatWithGemini = async (req, res) => {
  try {
    console.log("🤖 AI ROUTE HIT");

    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Step 1: Retrieve from DB
    const contextArray = await retrieveAllDocs(message);
    const hasContext = contextArray.length > 0;

    console.log("📨 Query:", message);
    console.log("📚 Context items found:", contextArray.length);

    // Step 2: Two separate prompts — one grounded, one general
    const prompt = hasContext
      ? `
You are "Menya-Rwanda Assistant", an expert guide for Rwanda's tourism platform.
You have access to real-time data from our platform database.

DATABASE RECORDS:
===
${contextArray.join("\n\n---\n\n")}
===

USER QUESTION: ${message}

INSTRUCTIONS:
- Answer using the DATABASE RECORDS above as your primary source
- Present information in a friendly, organized, engaging way
- Use bullet points or numbered lists where appropriate
- Do NOT mention "database", "records", or any technical terms
- If records are partial, naturally supplement with Rwanda knowledge
- End with a helpful follow-up suggestion or question
`
      : `
You are "Menya Rwanda Assistant", an expert AI guide for Rwanda tourism.
You have deep knowledge of Rwanda's culture, history, attractions, food, and events.

USER QUESTION: ${message}

INSTRUCTIONS:
- Answer helpfully using your knowledge about Rwanda and the topic asked
- Be warm, engaging, and informative
- Use bullet points or sections where appropriate
- Never mention databases or data sources
- If the topic is unrelated to Rwanda, still answer helpfully and naturally
- End with a relevant follow-up question or suggestion
`;

    // Step 3: Invoke Gemini with timeout
    const response = await Promise.race([
      model.invoke(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 15000)
      ),
    ]);

    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      retrievedCount: contextArray.length,
      sources: contextArray,
    });

  } catch (error) {
    console.error("❌ AI Error:", error.message);

    // Graceful fallback — answer from Gemini general knowledge
    try {
      const fallback = await model.invoke(
        `You are Menya Rwanda Assistant. Answer this helpfully: ${req.body.message}`
      );
      return res.status(200).json({
        success: true,
        userMessage: req.body.message,
        aiResponse: fallback.content,
        retrievedCount: 0,
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
};

module.exports = { chatWithGemini };