const express = require("express");
const { chatWithGemini } = require("../Controllers/aiChat");

const router = express.Router();

router.post("/chat", chatWithGemini);

module.exports = router;