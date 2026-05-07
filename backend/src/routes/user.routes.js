const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const {
  listUsers,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser
} = require("../controllers/user.controller");

router.get("/", authMiddleware, adminMiddleware, listUsers);
router.post("/", authMiddleware, adminMiddleware, createUser);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.patch("/:id/toggle-active", authMiddleware, adminMiddleware, toggleUserActive);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

module.exports = router;