const model = require("../config/gemini");
const retrieveAllDocs = require("../utils/retrieveDocs");
const Chat = require("../Models/chat");

const {
  updateUserMemory,
  getUserMemory,
  clearUserMemory,
} = require("../utils/userMemory");

const chatWithGemini = async (req, res) => {
  try {
    console.log("🚀 AI route hit");

    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const userId = req.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    console.log("📨 User message:", message);
    console.log("👤 User ID:", userId.toString());

    // 🧠 STEP 1: MEMORY UPDATE (ONLY ONE SYSTEM)
    updateUserMemory(userId, message);
    const memory = getUserMemory(userId);

    console.log("🧠 Memory:", memory);

    // 🔎 STEP 2: RAG CONTEXT
    const contextArray = await retrieveAllDocs(message);

    const safeContext = contextArray
      .slice(0, 4)
      .join("\n\n---\n\n")
      .slice(0, 1800);

    // 💬 STEP 3: CHAT HISTORY
    const chat = await Chat.findOne({ userId });

    const history = chat?.messages
      ?.slice(-6)
      ?.map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    // 🧠 STEP 4: PROMPT
    const prompt = `
You are "Menya Rwanda Assistant", a friendly tourism guide for Rwanda.

RULES:
- Speak naturally like a human chat assistant
- Avoid repeating greetings like "Welcome to Rwanda"
- Keep answers short and helpful
- Do NOT use structured formatting or labels

USER MEMORY:
Interests: ${memory.interests?.join(", ") || "none"}

CONVERSATION HISTORY:
${history || "No previous conversation"}

TOURISM CONTEXT:
${safeContext || "No relevant data found"}

USER MESSAGE:
${message}
`;

    console.log("🧠 Sending to Gemini...");

    const response = await Promise.race([
      model.invoke(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 90000)
      ),
    ]);

    console.log("✅ Gemini response received");

    // 💾 STEP 5: SAVE CHAT
    let chatDoc = chat;

    if (!chatDoc) {
      chatDoc = new Chat({
        userId,
        messages: [],
      });
    }

    chatDoc.messages.push(
      {
        role: "user",
        text: message,
        createdAt: new Date(),
      },
      {
        role: "ai",
        text: response.content,
        createdAt: new Date(),
      }
    );

    await chatDoc.save();

    console.log("💾 Chat saved");

    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response.content,
      retrievedCount: contextArray.length,
      sources: contextArray,
      memory,
    });

  } catch (error) {
    console.error("❌ AI Error:", error.message);

    try {
      const fallback = await model.invoke(
        `You are Menya Rwanda Assistant. Answer: ${req.body.message}`
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
        error: "AI service temporarily unavailable",
      });
    }
  }
};

module.exports = { chatWithGemini };