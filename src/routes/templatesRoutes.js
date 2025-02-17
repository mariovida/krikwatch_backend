const express = require("express");
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/templatesController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/templates", authMiddleware, getTemplates);
router.post("/templates", authMiddleware, createTemplate);
router.put("/templates/update-template/:id", authMiddleware, updateTemplate);
router.delete("/templates/delete-template/:id", authMiddleware, deleteTemplate);

module.exports = router;
