const express = require("express");

const {getChatHistory} = require("../Controllers/chat");

const router = express.Router();


router.get("/history/:userId", getChatHistory);

module.exports = router;

