const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  listReminderHistory,
  createReminderHistory
} = require("../controllers/reminderHistory.controller");

router.get("/", authMiddleware, listReminderHistory);
router.post("/", authMiddleware, createReminderHistory);

module.exports = router;