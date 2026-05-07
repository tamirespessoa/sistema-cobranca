const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const prisma = require("../config/prisma");

function generateReceiptNumber() {
  const now = new Date();

  return `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now()}`;
}

async function createReceiptPDF({ debt, payment, receiptNumber }) {
  const receiptsDir = path.join(__dirname, "../../uploads/receipts");

  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const fileName = `${receiptNumber}.pdf`;
  const filePath = path.join(receiptsDir, fileName);

  const doc = new PDFDocument({
    margin: 50,
    size: "A4"
  });

  doc.pipe(fs.createWriteStream(filePath));

  doc
    .fontSize(22)
    .text("RECIBO DE PAGAMENTO", {
      align: "center"
    });

  doc.moveDown();

  doc
    .fontSize(12)
    .text(`Número do recibo: ${receiptNumber}`);

  doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-BR")}`);

  doc.moveDown();

  doc
    .fontSize(14)
    .text("DADOS DO DEVEDOR", {
      underline: true
    });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Nome: ${debt.debtor?.fullName || "Não informado"}`);

  doc.text(`CPF: ${debt.debtor?.cpf || "Não informado"}`);
  doc.text(`RG: ${debt.debtor?.rg || "Não informado"}`);
  doc.text(`E-mail: ${debt.debtor?.email || "Não informado"}`);
  doc.text(`Telefone: ${debt.debtor?.whatsapp || debt.debtor?.phone || "Não informado"}`);

  doc.moveDown();

  doc
    .fontSize(14)
    .text("DADOS DA DÍVIDA", {
      underline: true
    });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Descrição: ${debt.description}`);

  doc.text(`Valor da dívida: R$ ${Number(debt.currentAmount).toFixed(2)}`);
  doc.text(`Data de vencimento: ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}`);
  doc.text(`Status atual: ${debt.status}`);

  doc.moveDown();

  doc
    .fontSize(14)
    .text("DADOS DO PAGAMENTO", {
      underline: true
    });

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Valor pago: R$ ${Number(payment.amount).toFixed(2)}`);

  doc.text(`Forma de pagamento: ${payment.paymentMethod}`);
  doc.text(`Data do pagamento: ${new Date(payment.paymentDate).toLocaleDateString("pt-BR")}`);
  doc.text(`Código da transação: ${payment.transactionCode || "Não informado"}`);

  if (payment.notes) {
    doc.text(`Observações: ${payment.notes}`);
  }

  doc.moveDown(2);

  doc.text(
    "Declaramos, para os devidos fins, que o pagamento acima foi registrado no Sistema de Cobrança Digital.",
    {
      align: "justify"
    }
  );

  doc.moveDown(4);

  doc.text("________________________________________", {
    align: "center"
  });

  doc.text("Assinatura do responsável", {
    align: "center"
  });

  doc.moveDown(2);

  doc
    .fontSize(9)
    .fillColor("gray")
    .text("Recibo gerado automaticamente pelo Sistema de Cobrança Digital.", {
      align: "center"
    });

  doc.end();

  return `/uploads/receipts/${fileName}`;
}

async function createPayment(req, res) {
  try {
    const {
      debtId,
      amount,
      paymentMethod,
      transactionCode,
      notes
    } = req.body;

    if (!debtId) {
      return res.status(400).json({
        message: "A dívida é obrigatória."
      });
    }

    if (!amount) {
      return res.status(400).json({
        message: "O valor do pagamento é obrigatório."
      });
    }

    const debt = await prisma.debt.findUnique({
      where: {
        id: debtId
      },
      include: {
        debtor: true,
        creditor: true,
        payments: true
      }
    });

    if (!debt) {
      return res.status(404).json({
        message: "Dívida não encontrada."
      });
    }

    const payment = await prisma.payment.create({
      data: {
        debtId,
        amount,
        paymentMethod,
        transactionCode,
        notes
      }
    });

    const totalPaidResult = await prisma.payment.aggregate({
      where: {
        debtId,
        status: "CONFIRMADO"
      },
      _sum: {
        amount: true
      }
    });

    const totalPaid = Number(totalPaidResult._sum.amount || 0);
    const debtValue = Number(debt.currentAmount);

    let newStatus = "ABERTA";

    if (totalPaid >= debtValue) {
      newStatus = "QUITADA";
    } else if (totalPaid > 0) {
      newStatus = "PARCIALMENTE_PAGA";
    }

    await prisma.debt.update({
      where: {
        id: debtId
      },
      data: {
        status: newStatus
      }
    });

    const receiptNumber = generateReceiptNumber();

    const fileUrl = await createReceiptPDF({
      debt,
      payment,
      receiptNumber
    });

    const receipt = await prisma.receipt.create({
      data: {
        debtId,
        paymentId: payment.id,
        receiptNumber,
        fileUrl
      }
    });

    return res.status(201).json({
      message: "Pagamento registrado com sucesso.",
      payment,
      receipt,
      totalPaid,
      debtStatus: newStatus
    });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);

    return res.status(500).json({
      message: "Erro interno ao registrar pagamento."
    });
  }
}

async function listPayments(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        receipt: true,
        debt: {
          include: {
            debtor: true
          }
        }
      },
      orderBy: {
        paymentDate: "desc"
      }
    });

    return res.json(payments);
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);

    return res.status(500).json({
      message: "Erro interno ao listar pagamentos."
    });
  }
}

module.exports = {
  createPayment,
  listPayments
};