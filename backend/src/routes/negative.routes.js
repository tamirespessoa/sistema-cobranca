const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  listOverdueDebts,
  markAsReadyForNegative,
  markWarningSent
} = require("../controllers/negative.controller");

router.get("/overdue", authMiddleware, listOverdueDebts);
router.post("/warning", authMiddleware, markWarningSent);
router.post("/ready", authMiddleware, markAsReadyForNegative);

module.exports = router;