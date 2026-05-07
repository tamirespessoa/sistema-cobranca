const prisma = require("../config/prisma");

async function createDebtor(req, res) {
  try {
    const {
      fullName,
      rg,
      cpf,
      phone,
      whatsapp,
      email,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      status,
      notes
    } = req.body;

    if (!fullName || !cpf) {
      return res.status(400).json({
        message: "Nome completo e CPF são obrigatórios."
      });
    }

    const debtorExists = await prisma.debtor.findUnique({
      where: { cpf }
    });

    if (debtorExists) {
      return res.status(400).json({
        message: "Já existe um devedor cadastrado com este CPF."
      });
    }

    const debtor = await prisma.debtor.create({
      data: {
        fullName,
        rg,
        cpf,
        phone,
        whatsapp,
        email,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        status: status || "ATIVO",
        notes
      }
    });

    return res.status(201).json({
      message: "Devedor cadastrado com sucesso.",
      debtor
    });
  } catch (error) {
    console.error("Erro ao cadastrar devedor:", error);
    return res.status(500).json({
      message: "Erro interno ao cadastrar devedor."
    });
  }
}

async function listDebtors(req, res) {
  try {
    const { search, status } = req.query;

    const debtors = await prisma.debtor.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { cpf: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                  { whatsapp: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } }
                ]
              }
            : {}
        ]
      },
      include: {
        debts: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(debtors);
  } catch (error) {
    console.error("Erro ao listar devedores:", error);
    return res.status(500).json({
      message: "Erro interno ao listar devedores."
    });
  }
}

async function getDebtorById(req, res) {
  try {
    const { id } = req.params;

    const debtor = await prisma.debtor.findUnique({
      where: { id },
      include: {
        debts: {
          include: {
            payments: true,
            pixCharges: true,
            receipts: true,
            notifications: true,
            negativeRecords: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!debtor) {
      return res.status(404).json({
        message: "Devedor não encontrado."
      });
    }

    return res.json(debtor);
  } catch (error) {
    console.error("Erro ao buscar devedor:", error);
    return res.status(500).json({
      message: "Erro interno ao buscar devedor."
    });
  }
}

async function updateDebtor(req, res) {
  try {
    const { id } = req.params;

    const {
      fullName,
      rg,
      cpf,
      phone,
      whatsapp,
      email,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      status,
      notes
    } = req.body;

    const debtorExists = await prisma.debtor.findUnique({
      where: { id }
    });

    if (!debtorExists) {
      return res.status(404).json({
        message: "Devedor não encontrado."
      });
    }

    if (cpf && cpf !== debtorExists.cpf) {
      const cpfExists = await prisma.debtor.findUnique({
        where: { cpf }
      });

      if (cpfExists) {
        return res.status(400).json({
          message: "Já existe outro devedor cadastrado com este CPF."
        });
      }
    }

    const debtor = await prisma.debtor.update({
      where: { id },
      data: {
        fullName,
        rg,
        cpf,
        phone,
        whatsapp,
        email,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        status,
        notes
      }
    });

    return res.json({
      message: "Devedor atualizado com sucesso.",
      debtor
    });
  } catch (error) {
    console.error("Erro ao atualizar devedor:", error);
    return res.status(500).json({
      message: "Erro interno ao atualizar devedor."
    });
  }
}

async function deleteDebtor(req, res) {
  try {
    const { id } = req.params;

    const debtorExists = await prisma.debtor.findUnique({
      where: { id },
      include: {
        debts: true
      }
    });

    if (!debtorExists) {
      return res.status(404).json({
        message: "Devedor não encontrado."
      });
    }

    if (debtorExists.debts.length > 0) {
      return res.status(400).json({
        message: "Não é possível excluir um devedor que possui dívidas cadastradas."
      });
    }

    await prisma.debtor.delete({
      where: { id }
    });

    return res.json({
      message: "Devedor excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir devedor:", error);
    return res.status(500).json({
      message: "Erro interno ao excluir devedor."
    });
  }
}

module.exports = {
  createDebtor,
  listDebtors,
  getDebtorById,
  updateDebtor,
  deleteDebtor
};