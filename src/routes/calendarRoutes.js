const express = require("express");
const {
    getAvailability,
    addAvailability,
} = require("../controllers/calendarController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/calendar", authMiddleware, getAvailability);
router.post("/calendar", authMiddleware, addAvailability);

module.exports = router;
