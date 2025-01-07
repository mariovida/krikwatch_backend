const express = require("express");
const {
  getUsers,
  createUser,
  setPassword,
  updateUser,
  toggleUserVerification,
} = require("../controllers/usersController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authMiddleware, getUsers);
router.post("/users", authMiddleware, createUser);
router.put("/users/:id", authMiddleware, updateUser);
router.post("/users/set-password", setPassword);
router.put(
  "/users/:id/toggle-verification",
  authMiddleware,
  toggleUserVerification
);

module.exports = router;
