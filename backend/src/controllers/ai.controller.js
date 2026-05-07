const OpenAI = require("openai");

const prisma = require("../config/prisma");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateCollectionMessage(req, res) {
  try {
    const { debtId, tone } = req.body;

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

    const debtor = debt.debtor;

    const amount = Number(debt.currentAmount || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const dueDate = new Date(debt.dueDate).toLocaleDateString("pt-BR");

    const prompt = `
Você é uma IA especializada em mensagens de cobrança financeira no Brasil.

Crie uma mensagem de cobrança profissional, humanizada e clara.

Tom da mensagem: ${tone || "amigavel"}

Dados da cobrança:
Nome do devedor: ${debtor?.fullName || "Não informado"}
CPF: ${debtor?.cpf || "Não informado"}
Descrição da dívida: ${debt.description}
Valor: ${amount}
Vencimento: ${dueDate}
Status: ${debt.status}

Regras:
- Escreva em português do Brasil.
- A mensagem deve estar pronta para enviar por WhatsApp.
- Seja educado e profissional.
- Não use linguagem agressiva.
- Não faça ameaça ilegal.
- Se o tom for "negativacao", mencione possível encaminhamento para análise de negativação, sem afirmar que já foi negativado.
- Se o tom for "negociacao", ofereça possibilidade de acordo.
- Não invente dados.
- Não use emojis em excesso.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    return res.json({
      message: response.output_text
    });
  } catch (error) {
    console.error("Erro ao gerar mensagem IA:", error);

    return res.status(500).json({
      message: "Erro ao gerar mensagem com IA."
    });
  }
}

module.exports = {
  generateCollectionMessage
};