const express = require("express");
const auth = require('../Middleware/authentication');
const { chatWithGemini } = require("../Controllers/aiChat");
const {getChatHistory,deleteChatHistory} = require("../Controllers/chat");
const verifyToken = require('../Middleware/checkToken');
const router = express.Router();

router.post("/chat",verifyToken, chatWithGemini);
router.get('/chat/history', verifyToken, getChatHistory);
router.delete('/chat/history', verifyToken, deleteChatHistory);     
module.exports = router;

