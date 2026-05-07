const QRCode = require("qrcode");

const prisma = require("../config/prisma");
const { generatePixPayload } = require("../utils/pix.util");

async function createPixCharge(req, res) {
  try {
    const { debtId } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: debtId },
      include: {
        debtor: true,
        payments: true
      }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    if (debt.status === "QUITADA") {
      return res.status(400).json({
        message: "Esta dívida já está quitada."
      });
    }

    const paidAmount = debt.payments
      .filter((payment) => payment.status === "CONFIRMADO")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const remainingAmount = Number(debt.currentAmount) - paidAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        message: "Não existe valor pendente para esta dívida."
      });
    }

    const txid = `DIV${debt.id.substring(0, 20)}`;

    const copyPasteCode = generatePixPayload({
      pixKey: process.env.PIX_KEY,
      merchantName: process.env.PIX_MERCHANT_NAME || "SISTEMA COBRANCA",
      merchantCity: process.env.PIX_MERCHANT_CITY || "SAO PAULO",
      amount: remainingAmount,
      txid
    });

    const qrCode = await QRCode.toDataURL(copyPasteCode);

    const pixCharge = await prisma.pixCharge.create({
      data: {
        debtId,
        amount: remainingAmount,
        pixKey: process.env.PIX_KEY,
        qrCode,
        copyPasteCode,
        externalId: txid,
        status: "AGUARDANDO_PAGAMENTO"
      }
    });

    return res.status(201).json({
      message: "Cobrança Pix gerada com sucesso.",
      pixCharge
    });
  } catch (error) {
    console.error("Erro ao gerar Pix:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar cobrança Pix."
    });
  }
}

async function listPixCharges(req, res) {
  try {
    const pixCharges = await prisma.pixCharge.findMany({
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

    return res.json(pixCharges);
  } catch (error) {
    console.error("Erro ao listar cobranças Pix:", error);

    return res.status(500).json({
      message: "Erro interno ao listar cobranças Pix."
    });
  }
}

module.exports = {
  createPixCharge,
  listPixCharges
};