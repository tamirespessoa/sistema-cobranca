const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  financialReport,
  financialReportPDF
} = require("../controllers/report.controller");

router.get("/financial", authMiddleware, financialReport);
router.get("/financial/pdf", authMiddleware, financialReportPDF);

module.exports = router;