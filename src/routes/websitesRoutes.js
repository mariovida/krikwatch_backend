const express = require("express");
const {
  upload,
  uploadWebsiteFavicon,
  takeScreenshot,
  getWebsites,
  getWebsiteById,
  updateWebsite,
  createWebsite,
  deleteWebsite,
} = require("../controllers/websitesController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/websites/upload-favicon",
  authMiddleware,
  upload.single("favicon"),
  uploadWebsiteFavicon
);
router.get("/websites/screenshot", takeScreenshot);
router.get("/websites", authMiddleware, getWebsites);
router.get("/websites/:id", authMiddleware, getWebsiteById);
router.post("/websites", authMiddleware, createWebsite);
router.put("/websites/:id", authMiddleware, updateWebsite);
router.delete("/websites/:id", authMiddleware, deleteWebsite);

module.exports = router;
