const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing from environment variables");
}
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

module.exports = model;

