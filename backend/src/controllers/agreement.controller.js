const prisma = require("../config/prisma");

const {
  createAgreementWithInstallments
} = require("../services/agreement.service");

async function listAgreements(req, res) {
  try {
    const agreements = await prisma.agreement.findMany({
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
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(agreements);
  } catch (error) {
    console.error("Erro ao listar acordos:", error);

    return res.status(500).json({
      message: "Erro ao listar acordos."
    });
  }
}

async function createAgreement(req, res) {
  try {
    const {
      debtId,
      negotiatedAmount,
      installments,
      agreementDate,
      firstDueDate,
      notes
    } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    if (!negotiatedAmount) {
      return res.status(400).json({
        message: "O valor negociado é obrigatório."
      });
    }

    const agreement = await createAgreementWithInstallments({
      debtId,
      negotiatedAmount,
      installments,
      agreementDate,
      firstDueDate,
      notes
    });

    return res.status(201).json({
      message: "Acordo criado com sucesso.",
      agreement
    });
  } catch (error) {
    console.error("Erro ao criar acordo:", error);

    return res.status(500).json({
      message: error.message || "Erro ao criar acordo."
    });
  }
}

async function updateAgreementStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const agreement = await prisma.agreement.findUnique({
      where: {
        id
      }
    });

    if (!agreement) {
      return res.status(404).json({
        message: "Acordo não encontrado."
      });
    }

    const updated = await prisma.agreement.update({
      where: {
        id
      },
      data: {
        status
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

    if (status === "CANCELADO") {
      await prisma.debt.update({
        where: {
          id: agreement.debtId
        },
        data: {
          status: "ABERTA",
          currentAmount: agreement.originalAmount
        }
      });
    }

    if (status === "QUITADO") {
      await prisma.debt.update({
        where: {
          id: agreement.debtId
        },
        data: {
          status: "QUITADA",
          currentAmount: 0
        }
      });

      await prisma.agreementInstallment.updateMany({
        where: {
          agreementId: agreement.id
        },
        data: {
          status: "PAGO",
          paidAt: new Date()
        }
      });
    }

    return res.json({
      message: "Status do acordo atualizado com sucesso.",
      agreement: updated
    });
  } catch (error) {
    console.error("Erro ao atualizar acordo:", error);

    return res.status(500).json({
      message: "Erro ao atualizar acordo."
    });
  }
}

async function updateInstallmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const installment = await prisma.agreementInstallment.findUnique({
      where: {
        id
      },
      include: {
        agreement: true
      }
    });

    if (!installment) {
      return res.status(404).json({
        message: "Parcela não encontrada."
      });
    }

    const updated = await prisma.agreementInstallment.update({
      where: {
        id
      },
      data: {
        status,
        paidAt: status === "PAGO" ? new Date() : null
      }
    });

    const pendingCount = await prisma.agreementInstallment.count({
      where: {
        agreementId: installment.agreementId,
        status: {
          not: "PAGO"
        }
      }
    });

    if (pendingCount === 0) {
      await prisma.agreement.update({
        where: {
          id: installment.agreementId
        },
        data: {
          status: "QUITADO"
        }
      });

      await prisma.debt.update({
        where: {
          id: installment.agreement.debtId
        },
        data: {
          status: "QUITADA",
          currentAmount: 0
        }
      });
    }

    return res.json({
      message: "Parcela atualizada com sucesso.",
      installment: updated
    });
  } catch (error) {
    console.error("Erro ao atualizar parcela:", error);

    return res.status(500).json({
      message: "Erro ao atualizar parcela."
    });
  }
}

async function deleteAgreement(req, res) {
  try {
    const { id } = req.params;

    const agreement = await prisma.agreement.findUnique({
      where: {
        id
      }
    });

    if (!agreement) {
      return res.status(404).json({
        message: "Acordo não encontrado."
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.agreementInstallment.deleteMany({
        where: {
          agreementId: id
        }
      });

      await tx.agreement.delete({
        where: {
          id
        }
      });

      await tx.debt.update({
        where: {
          id: agreement.debtId
        },
        data: {
          status: "ABERTA",
          currentAmount: agreement.originalAmount
        }
      });
    });

    return res.json({
      message: "Acordo excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir acordo:", error);

    return res.status(500).json({
      message: "Erro ao excluir acordo."
    });
  }
}

module.exports = {
  listAgreements,
  createAgreement,
  updateAgreementStatus,
  updateInstallmentStatus,
  deleteAgreement
};