const express = require("express");
const {
  getIncidents,
  createIncident,
} = require("../controllers/incidentsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/incidents", authMiddleware, getIncidents);
router.post("/incidents", authMiddleware, createIncident);

module.exports = router;
