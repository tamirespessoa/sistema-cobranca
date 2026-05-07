const bcrypt = require("bcryptjs");

const prisma = require("../config/prisma");

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      message: "Erro interno ao listar usuários."
    });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, active } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nome, e-mail e senha são obrigatórios."
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({
        message: "Já existe um usuário com este e-mail."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "OPERADOR",
        active: active === false ? false : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso.",
      user
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao criar usuário."
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, active } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { id }
    });

    if (!userExists) {
      return res.status(404).json({
        message: "Usuário não encontrado."
      });
    }

    const data = {
      name,
      email,
      role,
      active
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    return res.json({
      message: "Usuário atualizado com sucesso.",
      user
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar usuário."
    });
  }
}

async function toggleUserActive(req, res) {
  try {
    const { id } = req.params;

    const userExists = await prisma.user.findUnique({
      where: { id }
    });

    if (!userExists) {
      return res.status(404).json({
        message: "Usuário não encontrado."
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        active: !userExists.active
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });

    return res.json({
      message: "Status do usuário atualizado com sucesso.",
      user
    });
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao alterar status do usuário."
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({
        message: "Você não pode excluir o próprio usuário logado."
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id }
    });

    if (!userExists) {
      return res.status(404).json({
        message: "Usuário não encontrado."
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.json({
      message: "Usuário excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao excluir usuário."
    });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser
};