const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  getFinancialDashboard
} = require("../controllers/dashboard.controller");

router.get("/financial", authMiddleware, getFinancialDashboard);

module.exports = router;