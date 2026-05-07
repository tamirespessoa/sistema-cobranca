const prisma = require("../config/prisma");
const { sendEmail } = require("../services/email.service");

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function createDefaultEmailMessage(debt) {
  const debtorName = debt.debtor?.fullName || "tudo bem";

  return `Olá, ${debtorName}!

Estamos entrando em contato para lembrar sobre uma cobrança em aberto.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}

Pedimos, por gentileza, que regularize o pagamento ou entre em contato para negociação.

Atenciosamente,
Sistema de Cobrança Digital`;
}

async function sendDebtEmail(req, res) {
  try {
    const { debtId, subject, message } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    const debt = await prisma.debt.findUnique({
      where: {
        id: debtId
      },
      include: {
        debtor: true
      }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    if (!debt.debtor?.email) {
      return res.status(400).json({
        message: "O devedor não possui e-mail cadastrado."
      });
    }

    const finalSubject = subject || `Lembrete de cobrança - ${debt.description}`;
    const finalMessage = message || createDefaultEmailMessage(debt);

    await sendEmail({
      to: debt.debtor.email,
      subject: finalSubject,
      text: finalMessage,
      html: finalMessage.replace(/\n/g, "<br />")
    });

    await prisma.reminderHistory.create({
      data: {
        debtId: debt.id,
        channel: "EMAIL",
        tone: "manual",
        message: finalMessage,
        status: "ENVIADO"
      }
    });

    return res.json({
      message: "E-mail enviado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);

    return res.status(500).json({
      message: "Erro interno ao enviar e-mail."
    });
  }
}

module.exports = {
  sendDebtEmail
};