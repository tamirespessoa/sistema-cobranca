const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  generateCollectionMessage
} = require("../controllers/ai.controller");

router.post(
  "/generate-collection-message",
  authMiddleware,
  generateCollectionMessage
);

module.exports = router;