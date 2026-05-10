const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");

const chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const contextArray = await retrieveAllDocs(message);
    const hasContext = contextArray.length > 0;

    console.log("📨 Query:", message);
    console.log("📚 Context items:", contextArray.length);

    const prompt = hasContext
      ? `
You are "Menya Rwanda Assistant", an expert Rwanda tourism guide.
You have retrieved the following records from the platform database.

DATABASE RECORDS:
===
${contextArray.join("\n\n---\n\n")}
===

USER REQUEST: ${message}

INSTRUCTIONS:
- Read ALL the database records carefully
- Select ONLY the records that genuinely match what the user is asking for
- If a record doesn't match the user's interest (e.g. user wants water/hiking but record is about culture), DO NOT include it
- Present only the most relevant matches in a friendly, organized way
- If none of the database records are a good match, naturally supplement with your general knowledge of Rwanda
- Never say "database", "records", or mention technical terms
- Use bullet points or sections where helpful
- End with a helpful follow-up question
`
      : `
You are "Menya Rwanda Assistant", an expert AI guide for Rwanda tourism.
You have deep knowledge of Rwanda's culture, history, attractions, food, and events.

USER REQUEST: ${message}

INSTRUCTIONS:
- Answer helpfully using your Rwanda knowledge
- Be warm, engaging, and specific to Rwanda
- Use bullet points or sections where appropriate
- End with a relevant follow-up question
`;

    const response = await Promise.race([
      model.invoke(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 20000)
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

    try {
      const fallback = await model.invoke(
        `You are Menya Rwanda Assistant, a Rwanda tourism expert. Answer helpfully: ${req.body.message}`
      );
      return res.status(200).json({
        success: true,
        userMessage: req.body.message,
        aiResponse: fallback.content,
        retrievedCount: 0,
      });
    } catch {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = { chatWithGemini };