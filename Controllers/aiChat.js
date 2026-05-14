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
  // ✅ Get userId from authenticated user (set by auth middleware)
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      console.error("❌ No userId found - user not authenticated");
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    console.log("📨 User message:", message);
    console.log("👤 Authenticated User ID:", userId.toString());

    // Step 1: Retrieve from DB
    console.log("🔎 Retrieving docs...");
    const contextArray = await retrieveAllDocs(message);
    const hasContext = contextArray.length > 0;

const safeContext = contextArray
  .slice(0, 4)
  .join("\n\n---\n\n").slice(0, 3000);
    // Step 2: Build short focused prompt
 const prompt = hasContext
  ? `You are "Menya Rwanda Assistant", a friendly tourism guide for Rwanda.

RULES:
- Reply like a human chatting, NOT a report
- Do NOT use labels like [ATTRACTION], [EVENT], etc.
- Do NOT format responses as structured lists unless user asks
- Keep answers short, natural, and conversational
- Use the database context ONLY when relevant
- If multiple places exist, mention them naturally in sentences
- Always end with a simple follow-up question

DATABASE CONTEXT:
${safeContext}

USER: ${message}
`
  : `You are "Menya Rwanda Assistant", a friendly Rwanda tourism guide.

RULES:
- Reply like a natural conversation (like ChatGPT)
- No structured formatting, no headers, no labels
- Keep it simple and human
- End with a follow-up question

USER: ${message}
`;
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
      createdAt: new Date(),
    });


    console.log("🤖 Pushing AI message...");
    chat.messages.push({
      role: "ai",
      text: response.content,
      createdAt: new Date(),
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
    
    // Try to save error conversation if user is authenticated
    const userId = req.userId || req.user?._id;
    
    // Graceful fallback
    try {
      const fallback = await model.invoke(
        `You are Menya Rwanda Assistant, a Rwanda tourism expert. Answer this helpfully: ${req.body.message}`
      );
      
      // Save fallback response to chat history
      if (userId) {
        try {
          let chat = await Chat.findOne({ userId });
          if (!chat) {
            chat = new Chat({ userId, messages: [] });
          }
          chat.messages.push(
            { 
              role: "user", 
              text: req.body.message, 
              createdAt: new Date() 
            },
            { 
              role: "ai", 
              text: fallback.content, 
              createdAt: new Date() 
            }
          );
          await chat.save();
          console.log("✅ Fallback chat saved");
        } catch (saveError) {
          console.error("❌ Failed to save fallback chat:", saveError.message);
        }
      }
      
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