const express = require("express");
const {
  getAvailability,
  addAvailability,
  updateAvailability,
  deleteAvailability,
} = require("../controllers/calendarController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/calendar", authMiddleware, getAvailability);
router.post("/calendar", authMiddleware, addAvailability);
router.put("/calendar/:id", updateAvailability);
router.delete(
  "/calendar/delete-availability/:id",
  authMiddleware,
  deleteAvailability
);

module.exports = router;
