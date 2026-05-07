const prisma = require("../config/prisma");

async function listReminderHistory(req, res) {
  try {
    const histories = await prisma.reminderHistory.findMany({
      include: {
        debt: {
          include: {
            debtor: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(histories);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao listar histórico."
    });
  }
}

async function createReminderHistory(req, res) {
  try {
    const {
      debtId,
      channel,
      tone,
      message,
      status
    } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    if (!channel) {
      return res.status(400).json({
        message: "O canal é obrigatório."
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "A mensagem é obrigatória."
      });
    }

    const debt = await prisma.debt.findUnique({
      where: {
        id: debtId
      }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    const history = await prisma.reminderHistory.create({
      data: {
        debtId,
        channel,
        tone: tone || "manual",
        message,
        status: status || "ENVIADO"
      }
    });

    return res.status(201).json({
      message: "Histórico registrado com sucesso.",
      history
    });
  } catch (error) {
    console.error("Erro ao registrar histórico:", error);

    return res.status(500).json({
      message: "Erro interno ao registrar histórico."
    });
  }
}

module.exports = {
  listReminderHistory,
  createReminderHistory
};