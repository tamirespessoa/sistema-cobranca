const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createCharge
} = require("../controllers/charge.controller");

router.post("/", authMiddleware, createCharge);

module.exports = router;