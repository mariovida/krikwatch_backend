const express = require("express");
const { refreshTokenController, loginController } = require("../controllers/authController");

const router = express.Router();

router.post("/refresh-token", refreshTokenController);
// Login route
router.post("/login", loginController);

module.exports = router;
