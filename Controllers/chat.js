const Chat=require("../Models/chat");

const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const chat = await Chat.findOne({ userId });

    return res.json({
      success: true,
      messages: chat?.messages || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};
module.exports={getChatHistory};