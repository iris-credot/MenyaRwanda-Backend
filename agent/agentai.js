const model = require("../config/gemini");
const documentTool = require("../utils/retrieveDocs");

const { initializeAgentExecutorWithOptions } = require("langchain/agents");

let executor;

const createAgent = async () => {
  executor = await initializeAgentExecutorWithOptions(
    [documentTool],
    model,
    {
      agentType: "openai-functions",
      verbose: true,
    }
  );

  console.log("✅ AI Agent initialized");
};

const askAgent = async (message) => {
  if (!executor) {
    await createAgent();
  }

  const result = await executor.invoke({
    input: message,
  });

  return result.output;
};

module.exports = { askAgent };