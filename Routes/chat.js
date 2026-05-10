const express = require("express");
const auth = require('../Middleware/authentication');
const {getChatHistory} = require("../Controllers/chat");

const router = express.Router();


router.get("/history/:userId",auth.AuthJWT, getChatHistory);

module.exports = router;

