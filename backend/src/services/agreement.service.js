const prisma = require("../config/prisma");

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function calculateInstallments(totalAmount, installments) {
  const amount = Number(totalAmount);
  const quantity = Number(installments || 1);

  const baseAmount = Math.floor((amount / quantity) * 100) / 100;
  const items = [];

  let accumulated = 0;

  for (let i = 1; i <= quantity; i++) {
    let installmentAmount = baseAmount;

    if (i === quantity) {
      installmentAmount = Number((amount - accumulated).toFixed(2));
    }

    accumulated += installmentAmount;

    items.push({
      installmentNumber: i,
      amount: installmentAmount
    });
  }

  return items;
}

async function createAgreementWithInstallments({
  debtId,
  negotiatedAmount,
  installments,
  agreementDate,
  firstDueDate,
  notes
}) {
  return prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findUnique({
      where: {
        id: debtId
      }
    });

    if (!debt) {
      throw new Error("Dívida não encontrada.");
    }

    const quantity = Number(installments || 1);
    const firstDate = firstDueDate ? new Date(firstDueDate) : new Date();

    const agreement = await tx.agreement.create({
      data: {
        debtId,
        originalAmount: debt.currentAmount,
        negotiatedAmount: Number(negotiatedAmount),
        installments: quantity,
        agreementDate: agreementDate ? new Date(agreementDate) : new Date(),
        firstDueDate: firstDate,
        status: "ATIVO",
        notes
      }
    });

    const installmentItems = calculateInstallments(
      negotiatedAmount,
      quantity
    ).map((item, index) => ({
      agreementId: agreement.id,
      installmentNumber: item.installmentNumber,
      amount: item.amount,
      dueDate: addMonths(firstDate, index),
      status: "PENDENTE"
    }));

    await tx.agreementInstallment.createMany({
      data: installmentItems
    });

    await tx.debt.update({
      where: {
        id: debtId
      },
      data: {
        status: "EM_NEGOCIACAO",
        currentAmount: Number(negotiatedAmount)
      }
    });

    const agreementWithItems = await tx.agreement.findUnique({
      where: {
        id: agreement.id
      },
      include: {
        installmentItems: {
          orderBy: {
            installmentNumber: "asc"
          }
        },
        debt: {
          include: {
            debtor: true
          }
        }
      }
    });

    return agreementWithItems;
  });
}

module.exports = {
  createAgreementWithInstallments
};