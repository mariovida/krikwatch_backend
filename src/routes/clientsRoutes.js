const express = require("express");
const {
  getClients,
  createClient,
  updateClient,
} = require("../controllers/clientsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/clients", authMiddleware, getClients);
router.post("/clients", authMiddleware, createClient);
router.put("/clients/:id", authMiddleware, updateClient);

module.exports = router;
