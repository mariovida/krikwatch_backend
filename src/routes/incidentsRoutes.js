const express = require("express");
const {
  getIncidents,
  getIncidentById,
  getMessages,
  createIncident,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
} = require("../controllers/incidentsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/incidents", authMiddleware, getIncidents);
router.get("/incidents/:id", authMiddleware, getIncidentById);
router.get("/incident/messages/:id", authMiddleware, getMessages);
router.post("/incidents", authMiddleware, createIncident);
router.put("/incident/:id", authMiddleware, updateIncident);
router.put("/incidents/:id/status", authMiddleware, updateIncidentStatus);
router.delete("/incidents/delete-incident/:id", authMiddleware, deleteIncident);

module.exports = router;
