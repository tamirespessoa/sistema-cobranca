const prisma = require("../config/prisma");

const {
  sendEmail
} = require("./email.service");

function getDaysToDueDate(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due - today;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getTone(days) {
  if (days > 0 && days <= 3) {
    return "amigavel";
  }

  if (days === 0) {
    return "formal";
  }

  if (days <= -5 && days > -15) {
    return "urgente";
  }

  if (days <= -15 && days > -30) {
    return "negociacao";
  }

  if (days <= -30) {
    return "negativacao";
  }

  return null;
}

function createAutomaticMessage(debt, tone) {
  const debtorName = debt.debtor?.fullName || "tudo bem";
  const dueDate = new Date(debt.dueDate).toLocaleDateString("pt-BR");

  if (tone === "amigavel") {
    return `Olá, ${debtorName}!

Este é um lembrete amigável sobre uma cobrança próxima do vencimento.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  if (tone === "formal") {
    return `Olá, ${debtorName}!

Informamos que sua cobrança vence hoje.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Pedimos, por gentileza, que realize o pagamento até o final do dia ou entre em contato para mais informações.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  if (tone === "urgente") {
    return `Olá, ${debtorName}!

Consta em nosso sistema uma cobrança vencida em seu nome.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Pedimos que regularize a situação ou entre em contato para verificar possibilidades de negociação.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  if (tone === "negociacao") {
    return `Olá, ${debtorName}!

Estamos entrando em contato para oferecer uma possibilidade de negociação da cobrança em aberto.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Caso tenha interesse, responda este contato para avaliarmos uma forma de regularização.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  if (tone === "negativacao") {
    return `Olá, ${debtorName}!

Identificamos uma cobrança em aberto há mais tempo em seu nome.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Solicitamos a regularização ou contato para negociação. Caso não haja retorno, a situação poderá ser encaminhada para análise de negativação, conforme regras aplicáveis.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  return `Olá, ${debtorName}!

Existe uma cobrança em aberto em seu nome.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${dueDate}

Atenciosamente,
Sistema de Cobrança Digital`;
}

async function processAutomaticReminders() {
  try {
    console.log("⏰ Verificando lembretes automáticos...");

    const setting = await prisma.automationSetting.findFirst();

    if (!setting || !setting.automaticReminders) {
      console.log("⚠️ Lembretes automáticos estão desligados.");
      return;
    }

    const debts = await prisma.debt.findMany({
      where: {
        NOT: {
          status: {
            in: ["QUITADA", "CANCELADA"]
          }
        }
      },
      include: {
        debtor: true
      }
    });

    for (const debt of debts) {
      const days = getDaysToDueDate(debt.dueDate);
      const tone = getTone(days);

      if (!tone) {
        continue;
      }

      const alreadySentToday = await prisma.reminderHistory.findFirst({
        where: {
          debtId: debt.id,
          tone,
          channel: {
            in: ["AUTOMATICO", "EMAIL_AUTOMATICO"]
          },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      if (alreadySentToday) {
        continue;
      }

      const message = createAutomaticMessage(debt, tone);

      await prisma.reminderHistory.create({
        data: {
          debtId: debt.id,
          channel: "AUTOMATICO",
          tone,
          message,
          status: "GERADO"
        }
      });

      if (setting.automaticEmail && debt.debtor?.email) {
        try {
          await sendEmail({
            to: debt.debtor.email,
            subject: `Lembrete de cobrança - ${debt.description}`,
            text: message,
            html: message.replace(/\n/g, "<br />")
          });

          await prisma.reminderHistory.create({
            data: {
              debtId: debt.id,
              channel: "EMAIL_AUTOMATICO",
              tone,
              message,
              status: "ENVIADO"
            }
          });

          console.log(`✅ E-mail automático enviado para ${debt.debtor.fullName}`);
        } catch (emailError) {
          console.error("Erro ao enviar e-mail automático:", emailError);

          await prisma.reminderHistory.create({
            data: {
              debtId: debt.id,
              channel: "EMAIL_AUTOMATICO",
              tone,
              message,
              status: "ERRO"
            }
          });
        }
      } else {
        if (!setting.automaticEmail) {
          console.log("⚠️ Envio automático de e-mail está desligado.");
        }

        if (!debt.debtor?.email) {
          console.log(`⚠️ ${debt.debtor?.fullName} não possui e-mail cadastrado.`);
        }
      }
    }
  } catch (error) {
    console.error("Erro nos lembretes automáticos:", error);
  }
}

module.exports = {
  processAutomaticReminders
};