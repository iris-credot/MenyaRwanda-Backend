// utils/userMemory.js

/**
 * Lightweight user memory system
 * (can be swapped with MongoDB later without changing controller logic)
 */

const memoryStore = new Map();

/**
 * Default memory structure
 */
const createDefaultMemory = () => ({
  interests: [],
  lastTopics: [],
});

/**
 * Extract simple interests from user message
 */
const extractInterests = (message) => {
  const msg = message.toLowerCase();
  const interests = [];

  // tourism interests
  if (
    msg.includes("hiking") ||
    msg.includes("mountain") ||
    msg.includes("trek") ||
    msg.includes("climb")
  ) {
    interests.push("hiking");
  }

  if (
    msg.includes("lake") ||
    msg.includes("river") ||
    msg.includes("water") ||
    msg.includes("boat") ||
    msg.includes("waterfall")
  ) {
    interests.push("water");
  }

  if (
    msg.includes("safari") ||
    msg.includes("gorilla") ||
    msg.includes("wildlife") ||
    msg.includes("animal")
  ) {
    interests.push("wildlife");
  }

  if (
    msg.includes("food") ||
    msg.includes("restaurant") ||
    msg.includes("eat") ||
    msg.includes("dish")
  ) {
    interests.push("food");
  }

  if (
    msg.includes("culture") ||
    msg.includes("museum") ||
    msg.includes("history")
  ) {
    interests.push("culture");
  }

  return interests;
};

/**
 * Update user memory
 */
const updateUserMemory = (userId, message) => {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, createDefaultMemory());
  }

  const memory = memoryStore.get(userId);

  const newInterests = extractInterests(message);

  // merge interests (no duplicates)
  newInterests.forEach((i) => {
    if (!memory.interests.includes(i)) {
      memory.interests.push(i);
    }
  });

  // keep last 5 topics (simple conversation tracking)
  memory.lastTopics.push(message);
  if (memory.lastTopics.length > 5) {
    memory.lastTopics.shift();
  }

  memoryStore.set(userId, memory);

  console.log("🧠 Updated memory for user:", userId, memory);

  return memory;
};

/**
 * Get user memory
 */
const getUserMemory = (userId) => {
  return memoryStore.get(userId) || createDefaultMemory();
};

/**
 * Clear memory (optional utility)
 */
const clearUserMemory = (userId) => {
  memoryStore.delete(userId);
};

module.exports = {
  updateUserMemory,
  getUserMemory,
  clearUserMemory,
};