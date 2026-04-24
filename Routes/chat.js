const express = require('express');
const router = express.Router();

const chatController = require('../Controllers/chat');
const auth = require('../Middleware/authentication');

// ===============================
// 🔐 ALL ROUTES REQUIRE LOGIN
// ===============================

// Get or create user chat
router.get('/', auth.AuthJWT, chatController.getMyChat);

// Send message (user → assistant)
router.post('/send', auth.AuthJWT, chatController.sendMessage);

// Add assistant message (AI / webhook use)
router.post('/assistant', chatController.addAssistantMessage);

// Get recent messages
router.get('/recent', auth.AuthJWT, chatController.getRecentMessages);

// Delete single message
router.delete('/message/:messageId', auth.AuthJWT, chatController.deleteMessage);

// Clear entire chat
router.delete('/clear', auth.AuthJWT, chatController.clearChat);

module.exports = router;