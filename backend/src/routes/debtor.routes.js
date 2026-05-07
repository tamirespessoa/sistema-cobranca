const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createDebtor,
  listDebtors,
  getDebtorById,
  updateDebtor,
  deleteDebtor
} = require("../controllers/debtor.controller");

router.post("/", authMiddleware, createDebtor);
router.get("/", authMiddleware, listDebtors);
router.get("/:id", authMiddleware, getDebtorById);
router.put("/:id", authMiddleware, updateDebtor);
router.delete("/:id", authMiddleware, deleteDebtor);

module.exports = router;