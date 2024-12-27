const express = require("express");
const { createIncident } = require("../controllers/incidentsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/incidents", authMiddleware, createIncident);

module.exports = router;
