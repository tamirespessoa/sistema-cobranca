const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const prisma = require("../config/prisma");

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

async function getFinancialReportData(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date("2000-01-01");
  const end = endDate ? new Date(endDate) : new Date();

  end.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: start,
        lte: end
      },
      status: "CONFIRMADO"
    },
    include: {
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

  const debts = await prisma.debt.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      debtor: true,
      payments: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const totalReceived = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const totalDebtsCreated = debts.reduce(
    (sum, debt) => sum + Number(debt.currentAmount || 0),
    0
  );

  const totalOpen = debts.reduce((sum, debt) => {
    const paid = debt.payments
      .filter((payment) => payment.status === "CONFIRMADO")
      .reduce((pSum, payment) => pSum + Number(payment.amount || 0), 0);

    const remaining = Number(debt.currentAmount || 0) - paid;

    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  return {
    period: {
      startDate: start,
      endDate: end
    },
    summary: {
      totalReceived,
      totalDebtsCreated,
      totalOpen,
      paymentsCount: payments.length,
      debtsCount: debts.length
    },
    payments,
    debts
  };
}

async function financialReport(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const report = await getFinancialReportData(startDate, endDate);

    return res.json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar relatório financeiro."
    });
  }
}

async function financialReportPDF(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const report = await getFinancialReportData(startDate, endDate);

    const reportsDir = path.join(__dirname, "../../uploads/reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `relatorio-financeiro-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc
      .fontSize(20)
      .text("RELATÓRIO FINANCEIRO", {
        align: "center"
      });

    doc.moveDown();

    doc
      .fontSize(11)
      .text(`Período: ${formatDate(report.period.startDate)} até ${formatDate(report.period.endDate)}`);

    doc.text(`Emitido em: ${formatDate(new Date())}`);

    doc.moveDown();

    doc
      .fontSize(14)
      .text("RESUMO FINANCEIRO", {
        underline: true
      });

    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Total recebido: ${formatCurrency(report.summary.totalReceived)}`);
    doc.text(`Dívidas criadas: ${formatCurrency(report.summary.totalDebtsCreated)}`);
    doc.text(`Saldo em aberto: ${formatCurrency(report.summary.totalOpen)}`);
    doc.text(`Quantidade de pagamentos: ${report.summary.paymentsCount}`);
    doc.text(`Quantidade de dívidas: ${report.summary.debtsCount}`);

    doc.moveDown();

    doc
      .fontSize(14)
      .text("PAGAMENTOS DO PERÍODO", {
        underline: true
      });

    doc.moveDown(0.5);

    if (report.payments.length === 0) {
      doc.fontSize(11).text("Nenhum pagamento encontrado no período.");
    } else {
      report.payments.forEach((payment, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${payment.debt?.debtor?.fullName || "Não informado"} | ${payment.debt?.description || "Dívida"} | ${formatCurrency(payment.amount)} | ${payment.paymentMethod} | ${formatDate(payment.paymentDate)}`
        );
      });
    }

    doc.moveDown();

    doc
      .fontSize(14)
      .text("DÍVIDAS CRIADAS NO PERÍODO", {
        underline: true
      });

    doc.moveDown(0.5);

    if (report.debts.length === 0) {
      doc.fontSize(11).text("Nenhuma dívida encontrada no período.");
    } else {
      report.debts.forEach((debt, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${debt.debtor?.fullName || "Não informado"} | ${debt.description} | ${formatCurrency(debt.currentAmount)} | Venc.: ${formatDate(debt.dueDate)} | ${debt.status}`
        );
      });
    }

    doc.moveDown(2);

    doc
      .fontSize(9)
      .fillColor("gray")
      .text("Relatório gerado automaticamente pelo Sistema de Cobrança Digital.", {
        align: "center"
      });

    doc.end();

    stream.on("finish", () => {
      return res.json({
        message: "Relatório PDF gerado com sucesso.",
        fileUrl: `/uploads/reports/${fileName}`
      });
    });
  } catch (error) {
    console.error("Erro ao gerar PDF do relatório:", error);

    return res.status(500).json({
      message: "Erro interno ao gerar PDF do relatório."
    });
  }
}

module.exports = {
  financialReport,
  financialReportPDF
};