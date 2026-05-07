function adminMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado."
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Acesso negado. Apenas administradores podem acessar esta área."
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao verificar permissão."
    });
  }
}

module.exports = adminMiddleware;