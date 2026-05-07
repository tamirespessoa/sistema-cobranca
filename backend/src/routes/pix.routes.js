const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPixCharge,
  listPixCharges
} = require("../controllers/pix.controller");

router.post("/", authMiddleware, createPixCharge);
router.get("/", authMiddleware, listPixCharges);

module.exports = router;