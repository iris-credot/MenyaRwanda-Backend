const express = require("express");
const { chatWithGemini } = require("../Controllers/aiChat");
const {getChatHistory} = require("../Controllers/chat");

const router = express.Router();

router.post("/chat", chatWithGemini);
router.get("/history/:userId", getChatHistory);

module.exports = router;