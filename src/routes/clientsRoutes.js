const express = require("express");
const {
  getClients,
  createClient,
  updateClient,
  uploadClientLogo,
  deleteClient,
} = require("../controllers/clientsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/clients", authMiddleware, getClients);
router.post("/clients", authMiddleware, createClient);
router.put("/clients/:id", authMiddleware, updateClient);
router.post("/clients/:id/upload-logo", uploadClientLogo);
router.delete("/clients/delete-client/:id", authMiddleware, deleteClient);

module.exports = router;
