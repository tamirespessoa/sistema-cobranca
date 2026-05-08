const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  listAgreements,
  createAgreement,
  updateAgreementStatus,
  updateInstallmentStatus,
  deleteAgreement
} = require("../controllers/agreement.controller");

router.get("/", authMiddleware, listAgreements);
router.post("/", authMiddleware, createAgreement);
router.patch("/:id/status", authMiddleware, updateAgreementStatus);
router.patch("/installments/:id/status", authMiddleware, updateInstallmentStatus);
router.delete("/:id", authMiddleware, deleteAgreement);

module.exports = router;