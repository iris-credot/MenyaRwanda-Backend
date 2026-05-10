const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");
const Chat = require("../Models/chat");
const chatWithGemini = async (req, res) => {
  try {
    console.log("🚀 AI route hit");
    const { message } = req.body;

    if (!message?.trim()) {
       console.log("❌ No message");
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
   console.log("📨 User message:", message);
    // Step 1: Retrieve from DB
     // 🔐 USER DEBUG
    console.log("👤 req.user:", req.user);
    console.log("🆔 req.user._id:", req.user?._id);

    const userId = req.user?._id || req.body.userId;
    console.log("👤 userId:", userId);

if (!userId) {
  return res.status(400).json({
    success: false,
    message: "Missing userId"
  });
}

   

    // 📚 RAG retrieval
    console.log("🔎 Retrieving docs...");
    const contextArray = await retrieveAllDocs(message);
    const hasContext = contextArray.length > 0;

    console.log("📨 Query:", message);
    console.log("📚 Context items:", contextArray.length);
const safeContext = contextArray
  .slice(0, 4)
  .join("\n\n---\n\n").slice(0, 3000);
    // Step 2: Build short focused prompt
    const prompt = hasContext
      ? `You are "Menya Rwanda Assistant", a Rwanda tourism guide.

RELEVANT DATA FROM DATABASE:
${safeContext}

USER: ${message}

Reply helpfully using the data above. Only use records relevant to the user's question. Ignore irrelevant records. Be friendly and organized. End with a follow-up question.`

      : `You are "Menya Rwanda Assistant", a Rwanda tourism expert.

USER: ${message}

Answer helpfully about Rwanda. Be warm, specific, and engaging. End with a follow-up question.`;
 console.log("🧠 Sending to Gemini...");
    // Step 3: Call Gemini with 45s timeout
    const response = await Promise.race([
      model.invoke(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 90000)
      ),
    ]);
  console.log("✅ Gemini raw response:", response);
     console.log("✅ Gemini response received");
    console.log("🧾 Response content:", response?.content);

    // 💾 DB SAVE DEBUG
    console.log("💾 Checking chat in DB for user:", userId);

    let chat = await Chat.findOne({ userId });

    console.log("📦 Existing chat found:", !!chat);

    if (!chat) {
      console.log("🆕 Creating new chat document");
      chat = new Chat({
        userId,
        messages: [],
      });
    }

    console.log("💬 Pushing user message...");
    chat.messages.push({
      role: "user",
      text: message,
    });

    console.log("🤖 Pushing AI message...");
    chat.messages.push({
      role: "ai",
      text: response.content,
    });
console.log("💾 ABOUT TO SAVE CHAT");
console.log("👤 userId:", userId);
console.log("💬 messages:", chat.messages);
    console.log("💾 Saving chat to DB...");
    await chat.save();

    console.log("✅ Chat saved successfully!");
    console.log("📊 Total messages now:", chat.messages.length);

    console.log("================ AI REQUEST END ================\n");

    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      retrievedCount: contextArray.length,
      sources: contextArray,
    });

  } catch (error) {
    console.error("❌ AI Error:", error.message);
console.error("❌ Full error:", JSON.stringify(error, null, 2)); 
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