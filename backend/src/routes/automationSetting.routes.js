const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const {
  getAutomationSetting,
  updateAutomationSetting,
  runAutomationNow
} = require("../controllers/automationSetting.controller");

router.get("/", authMiddleware, adminMiddleware, getAutomationSetting);
router.put("/", authMiddleware, adminMiddleware, updateAutomationSetting);
router.post("/run-now", authMiddleware, adminMiddleware, runAutomationNow);

module.exports = router;