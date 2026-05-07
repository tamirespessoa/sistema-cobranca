const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createDebt,
  listDebts,
  getDebtById,
  updateDebt,
  deleteDebt
} = require("../controllers/debt.controller");

router.post("/", authMiddleware, createDebt);
router.get("/", authMiddleware, listDebts);
router.get("/:id", authMiddleware, getDebtById);
router.put("/:id", authMiddleware, updateDebt);
router.delete("/:id", authMiddleware, deleteDebt);

module.exports = router;