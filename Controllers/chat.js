const asyncWrapper = require('../Middleware/async');
const Chat = require('../Models/chat');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');

const chatController = {

  //  GET MY CHAT (create if not exists)
  getMyChat: asyncWrapper(async (req, res, next) => {
    let chat = await Chat.findOne({ user: req.user.id });

    if (!chat) {
      chat = await Chat.create({
        user: req.user.id,
        messages: []
      });
    }

    res.status(200).json({
      success: true,
      chat
    });
  }),

  //  SEND MESSAGE (user → assistant placeholder)
  sendMessage: asyncWrapper(async (req, res, next) => {
    const { content } = req.body;

    if (!content) {
      return next(new BadRequest('Message content is required'));
    }

    let chat = await Chat.findOne({ user: req.user.id });

    if (!chat) {
      chat = await Chat.create({
        user: req.user.id,
        messages: []
      });
    }

    // 1. Save user message
    chat.messages.push({
      role: 'user',
      content
    });

    //  2. OPTIONAL: simulate assistant response
    // Replace this later with AI or system logic
    const assistantReply = `You said: ${content}`;

    chat.messages.push({
      role: 'assistant',
      content: assistantReply
    });

    await chat.save();

    res.status(200).json({
      success: true,
      messages: chat.messages
    });
  }),

  // ADD ASSISTANT MESSAGE (for AI/webhook use)
  addAssistantMessage: asyncWrapper(async (req, res, next) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return next(new BadRequest('userId and content required'));
    }

    const chat = await Chat.findOne({ user: userId });

    if (!chat) {
      return next(new NotFound('Chat not found'));
    }

    chat.messages.push({
      role: 'assistant',
      content
    });

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Assistant reply added',
      chat
    });
  }),

  //  DELETE CHAT (clear messages)
  clearChat: asyncWrapper(async (req, res, next) => {
    const chat = await Chat.findOne({ user: req.user.id });

    if (!chat) {
      return next(new NotFound('Chat not found'));
    }

    chat.messages = [];
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat cleared'
    });
  }),

  //  DELETE SINGLE MESSAGE
  deleteMessage: asyncWrapper(async (req, res, next) => {
    const { messageId } = req.params;

    const chat = await Chat.findOne({ user: req.user.id });

    if (!chat) {
      return next(new NotFound('Chat not found'));
    }

    chat.messages = chat.messages.filter(
      (msg) => msg._id.toString() !== messageId
    );

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted',
      messages: chat.messages
    });
  }),

  //  GET LAST N MESSAGES (for performance)
  getRecentMessages: asyncWrapper(async (req, res, next) => {
    const { limit = 20 } = req.query;

    const chat = await Chat.findOne({ user: req.user.id });

    if (!chat) {
      return next(new NotFound('Chat not found'));
    }

    const messages = chat.messages.slice(-limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  })

};

module.exports = chatController;