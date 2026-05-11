const Chat = require("../Models/chat");

const getChatHistory = async (req, res) => {
  try {
    // ✅ Get userId from authenticated user, not from params (security!)
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Optional: Check if user is requesting their own history
    // If you have admin role that can view others' history
    if (req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "You can only access your own chat history",
      });
    }

    const targetUserId = req.params.userId || userId;
    
    const chat = await Chat.findOne({ userId: targetUserId });
    
    // ✅ Handle case when no chat exists
    if (!chat) {
      return res.json({
        success: true,
        messages: [],
        totalMessages: 0,
        message: "No chat history found for this user",
      });
    }

    return res.json({
      success: true,
      messages: chat.messages,
      totalMessages: chat.messages.length,
      lastUpdated: chat.updatedAt,
    });
    
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: err.message, // Useful for debugging
    });
  }
};
const deleteChatHistory = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const result = await Chat.findOneAndDelete({ userId });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No chat history found to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat history deleted successfully",
    });
    
  } catch (error) {
    console.error("❌ Error deleting chat history:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete chat history",
    });
  }
};

module.exports = { getChatHistory, deleteChatHistory  };