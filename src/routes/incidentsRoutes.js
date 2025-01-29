const express = require("express");
const {
  getIncidents,
  getIncidentById,
  createIncident,
} = require("../controllers/incidentsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/incidents", authMiddleware, getIncidents);
router.get("/incidents/:id", authMiddleware, getIncidentById);
router.post("/incidents", authMiddleware, createIncident);

module.exports = router;
