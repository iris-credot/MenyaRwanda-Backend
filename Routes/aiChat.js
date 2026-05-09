import express from "express";
import { chatWithGemini } from "../Controllers/aiChat";

const router = express.Router();

router.post("/chat", chatWithGemini);

export default router;