const prisma = require("../config/prisma");

async function createCharge(req, res) {
  try {
    const {
      debtor,
      debt
    } = req.body;

    if (!debtor?.fullName || !debtor?.cpf) {
      return res.status(400).json({
        message: "Nome completo e CPF do devedor são obrigatórios."
      });
    }

    if (!debt?.description || !debt?.originalAmount || !debt?.dueDate) {
      return res.status(400).json({
        message: "Descrição, valor e vencimento da dívida são obrigatórios."
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let savedDebtor = await tx.debtor.findUnique({
        where: { cpf: debtor.cpf }
      });

      if (!savedDebtor) {
        savedDebtor = await tx.debtor.create({
          data: {
            fullName: debtor.fullName,
            rg: debtor.rg,
            cpf: debtor.cpf,
            phone: debtor.phone,
            whatsapp: debtor.whatsapp,
            email: debtor.email,
            street: debtor.street,
            number: debtor.number,
            complement: debtor.complement,
            neighborhood: debtor.neighborhood,
            city: debtor.city,
            state: debtor.state,
            zipCode: debtor.zipCode,
            status: debtor.status || "ATIVO",
            notes: debtor.notes
          }
        });
      }

      const savedDebt = await tx.debt.create({
        data: {
          debtorId: savedDebtor.id,
          createdById: req.user.id,
          description: debt.description,
          originalAmount: Number(debt.originalAmount),
          currentAmount: Number(debt.currentAmount || debt.originalAmount),
          dueDate: new Date(debt.dueDate),
          paymentMethod: debt.paymentMethod || "PIX",
          installmentNumber: debt.installmentNumber ? Number(debt.installmentNumber) : null,
          totalInstallments: debt.totalInstallments ? Number(debt.totalInstallments) : null,
          notes: debt.notes
        },
        include: {
          debtor: true
        }
      });

      return {
        debtor: savedDebtor,
        debt: savedDebt
      };
    });

    return res.status(201).json({
      message: "Cobrança cadastrada com sucesso.",
      ...result
    });
  } catch (error) {
    console.error("Erro ao cadastrar cobrança:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar cobrança."
    });
  }
}

module.exports = {
  createCharge
};