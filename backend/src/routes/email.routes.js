const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  sendDebtEmail
} = require("../controllers/email.controller");

router.post("/send-debt-email", authMiddleware, sendDebtEmail);

module.exports = router;