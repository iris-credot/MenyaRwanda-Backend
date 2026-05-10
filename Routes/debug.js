const express = require("express");
const router = express.Router();

const Document = require("../Models/document");

router.get("/docs", async (req, res) => {
  const docs = await Document.find();

  res.json({
    count: docs.length,
    docs,
  });
});

module.exports = router;