const { askAgent } = require("../agent/agentai");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await askAgent(message);

    return res.status(200).json({
      success: true,
      userMessage: message,
      aiResponse: response,
    });

  } catch (error) {
    console.error("AI Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { chatWithAI };