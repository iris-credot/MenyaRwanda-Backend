const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");

const chatWithGemini = async (req, res) => {
  try {
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
    console.log("📚 Context items:", contextArray.length);

    // Step 2: Build short focused prompt
    const prompt = hasContext
      ? `You are "Menya Rwanda Assistant", a Rwanda tourism guide.

RELEVANT DATA FROM DATABASE:
${contextArray.join("\n\n---\n\n")}

USER: ${message}

Reply helpfully using the data above. Only use records relevant to the user's question. Ignore irrelevant records. Be friendly and organized. End with a follow-up question.`

      : `You are "Menya Rwanda Assistant", a Rwanda tourism expert.

USER: ${message}

Answer helpfully about Rwanda. Be warm, specific, and engaging. End with a follow-up question.`;

    // Step 3: Call Gemini with 45s timeout
    const response = await Promise.race([
      model.invoke(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 45000)
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

    // Graceful fallback — answer from Gemini general knowledge only
    try {
      const fallback = await model.invoke(
        `You are Menya Rwanda Assistant, a Rwanda tourism expert. Answer this helpfully: ${req.body.message}`
      );
      return res.status(200).json({
        success: true,
        userMessage: req.body.message,
        aiResponse: fallback.content,
        retrievedCount: 0,
      });
    } catch (fallbackError) {
      console.error("❌ Fallback failed:", fallbackError.message);
      return res.status(500).json({
        success: false,
        error: "AI service is temporarily unavailable. Please try again.",
      });
    }
  }
};

module.exports = { chatWithGemini };