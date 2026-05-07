const prisma = require("../config/prisma");

async function getFinancialDashboard(req, res) {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        payments: true,
        debtor: true
      }
    });

    const today = new Date();

    let totalToReceive = 0;
    let totalReceived = 0;
    let totalOpen = 0;
    let totalOverdue = 0;

    let totalDebts = debts.length;
    let openDebts = 0;
    let paidDebts = 0;
    let partialDebts = 0;
    let overdueDebts = 0;

    debts.forEach((debt) => {
      const debtAmount = Number(debt.currentAmount);

      const paidAmount = debt.payments
        .filter((payment) => payment.status === "CONFIRMADO")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      totalToReceive += debtAmount;
      totalReceived += paidAmount;

      const remainingAmount = debtAmount - paidAmount;

      if (remainingAmount > 0) {
        totalOpen += remainingAmount;
      }

      if (debt.status === "QUITADA") {
        paidDebts += 1;
      }

      if (debt.status === "PARCIALMENTE_PAGA") {
        partialDebts += 1;
      }

      if (debt.status === "ABERTA") {
        openDebts += 1;
      }

      if (
        debt.status !== "QUITADA" &&
        debt.status !== "CANCELADA" &&
        new Date(debt.dueDate) < today
      ) {
        overdueDebts += 1;
        totalOverdue += remainingAmount > 0 ? remainingAmount : debtAmount;
      }
    });

    return res.json({
      cards: {
        totalToReceive,
        totalReceived,
        totalOpen,
        totalOverdue,
        totalDebts,
        openDebts,
        paidDebts,
        partialDebts,
        overdueDebts
      },
      recentDebts: debts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((debt) => ({
          id: debt.id,
          debtorName: debt.debtor?.fullName,
          description: debt.description,
          amount: debt.currentAmount,
          dueDate: debt.dueDate,
          status: debt.status
        }))
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);

    return res.status(500).json({
      message: "Erro interno ao carregar dashboard financeiro."
    });
  }
}

module.exports = {
  getFinancialDashboard
};