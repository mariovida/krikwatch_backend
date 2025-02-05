const express = require("express");
const {
  getTemplates,
  createTemplate,
} = require("../controllers/templatesController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/templates", authMiddleware, getTemplates);
router.post("/templates", authMiddleware, createTemplate);

module.exports = router;
