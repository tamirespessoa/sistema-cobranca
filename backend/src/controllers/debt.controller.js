const prisma = require("../config/prisma");

async function createDebt(req, res) {
  try {
    const {
      debtorId,
      creditorId,
      description,
      originalAmount,
      currentAmount,
      dueDate,
      paymentMethod,
      installmentNumber,
      totalInstallments,
      notes
    } = req.body;

    if (!debtorId) {
      return res.status(400).json({
        message: "O devedor é obrigatório."
      });
    }

    if (!description) {
      return res.status(400).json({
        message: "A descrição da dívida é obrigatória."
      });
    }

    if (!originalAmount) {
      return res.status(400).json({
        message: "O valor da dívida é obrigatório."
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        message: "A data de vencimento é obrigatória."
      });
    }

    const debtorExists = await prisma.debtor.findUnique({
      where: {
        id: debtorId
      }
    });

    if (!debtorExists) {
      return res.status(404).json({
        message: "Devedor não encontrado."
      });
    }

    const debt = await prisma.debt.create({
      data: {
        debtorId,
        creditorId,
        createdById: req.user.id,
        description,
        originalAmount,
        currentAmount: currentAmount || originalAmount,
        dueDate: new Date(dueDate),
        paymentMethod,
        installmentNumber,
        totalInstallments,
        notes
      },
      include: {
        debtor: true,
        creditor: true
      }
    });

    return res.status(201).json({
      message: "Dívida cadastrada com sucesso.",
      debt
    });
  } catch (error) {
    console.error("Erro ao cadastrar dívida:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar dívida."
    });
  }
}

async function listDebts(req, res) {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        debtor: true,
        creditor: true,
        payments: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(debts);
  } catch (error) {
    console.error("Erro ao listar dívidas:", error);

    return res.status(500).json({
      message: "Erro interno ao listar dívidas."
    });
  }
}

async function getDebtById(req, res) {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findUnique({
      where: {
        id
      },
      include: {
        debtor: true,
        creditor: true,
        payments: true,
        receipts: true,
        pixCharges: true,
        notifications: true,
        negativeRecords: true
      }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    return res.json(debt);
  } catch (error) {
    console.error("Erro ao buscar dívida:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar dívida."
    });
  }
}

async function updateDebt(req, res) {
  try {
    const { id } = req.params;

    const debtExists = await prisma.debt.findUnique({
      where: { id }
    });

    if (!debtExists) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    const {
      description,
      originalAmount,
      currentAmount,
      dueDate,
      paymentMethod,
      status,
      installmentNumber,
      totalInstallments,
      notes
    } = req.body;

    const debt = await prisma.debt.update({
      where: {
        id
      },
      data: {
        description,
        originalAmount,
        currentAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paymentMethod,
        status,
        installmentNumber,
        totalInstallments,
        notes
      }
    });

    return res.json({
      message: "Dívida atualizada com sucesso.",
      debt
    });
  } catch (error) {
    console.error("Erro ao atualizar dívida:", error);

    return res.status(500).json({
      message: "Erro interno ao atualizar dívida."
    });
  }
}

async function deleteDebt(req, res) {
  try {
    const { id } = req.params;

    const debtExists = await prisma.debt.findUnique({
      where: { id }
    });

    if (!debtExists) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    await prisma.debt.delete({
      where: {
        id
      }
    });

    return res.json({
      message: "Dívida excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir dívida:", error);

    return res.status(500).json({
      message: "Erro interno ao excluir dívida."
    });
  }
}

module.exports = {
  createDebt,
  listDebts,
  getDebtById,
  updateDebt,
  deleteDebt
};