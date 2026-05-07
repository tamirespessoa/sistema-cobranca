const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPayment,
  listPayments
} = require("../controllers/payment.controller");

router.post("/", authMiddleware, createPayment);
router.get("/", authMiddleware, listPayments);

module.exports = router;