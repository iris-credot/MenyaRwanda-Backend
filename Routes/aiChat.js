const express = require("express");
const auth = require('../Middleware/authentication');
const { chatWithGemini } = require("../Controllers/aiChat");


const router = express.Router();

router.post("/chat",auth.AuthJWT, chatWithGemini);


module.exports = router;

