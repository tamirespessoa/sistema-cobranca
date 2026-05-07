const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    message: "Usuário autenticado com sucesso.",
    user: req.user
  });
});

module.exports = router;