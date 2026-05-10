const { ChatGroq } = require("@langchain/groq");

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing from environment variables");
}

const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

module.exports = model;