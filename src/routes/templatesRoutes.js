const express = require("express");
const {
  getTemplates,
  createTemplate,
  deleteTemplate,
} = require("../controllers/templatesController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/templates", authMiddleware, getTemplates);
router.post("/templates", authMiddleware, createTemplate);
router.delete("/templates/delete-template/:id", authMiddleware, deleteTemplate);

module.exports = router;
