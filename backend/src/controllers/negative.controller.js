const prisma = require("../config/prisma");

async function listOverdueDebts(req, res) {
  try {
    const today = new Date();

    const debts = await prisma.debt.findMany({
      where: {
        dueDate: {
          lt: today
        },
        status: {
          notIn: ["QUITADA", "CANCELADA"]
        }
      },
      include: {
        debtor: true,
        payments: true,
        negativeRecords: true
      },
      orderBy: {
        dueDate: "asc"
      }
    });

    return res.json(debts);
  } catch (error) {
    console.error("Erro ao listar inadimplentes:", error);

    return res.status(500).json({
      message: "Erro interno ao listar inadimplentes."
    });
  }
}

async function markAsReadyForNegative(req, res) {
  try {
    const { debtId, notes } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    const record = await prisma.negativeRecord.create({
      data: {
        debtId,
        status: "APTO_PARA_NEGATIVACAO",
        notes
      }
    });

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        status: "NEGATIVADA"
      }
    });

    return res.status(201).json({
      message: "Dívida marcada como apta para negativação.",
      record
    });
  } catch (error) {
    console.error("Erro ao marcar negativação:", error);

    return res.status(500).json({
      message: "Erro interno ao marcar negativação."
    });
  }
}

async function markWarningSent(req, res) {
  try {
    const { debtId, notes } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    const record = await prisma.negativeRecord.create({
      data: {
        debtId,
        status: "AVISO_ENVIADO",
        warningSentAt: new Date(),
        notes
      }
    });

    return res.status(201).json({
      message: "Aviso de negativação registrado com sucesso.",
      record
    });
  } catch (error) {
    console.error("Erro ao registrar aviso:", error);

    return res.status(500).json({
      message: "Erro interno ao registrar aviso."
    });
  }
}

module.exports = {
  listOverdueDebts,
  markAsReadyForNegative,
  markWarningSent
};