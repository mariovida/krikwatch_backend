const express = require("express");
const {
  getContacts,
  createContact,
  updateContact,
} = require("../controllers/contactsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/contacts/website/:websiteId", authMiddleware, getContacts);
router.post("/contacts", authMiddleware, createContact);
router.put("/contacts/:id", authMiddleware, updateContact);

module.exports = router;
