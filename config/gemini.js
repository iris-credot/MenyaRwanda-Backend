const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing from environment variables");
}
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-8b",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
  streaming: true,  
});

module.exports = model;

