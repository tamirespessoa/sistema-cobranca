import { useEffect, useMemo, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Reminders() {
  const [debts, setDebts] = useState([]);
  const [filter, setFilter] = useState("TODOS");
  const [aiMessages, setAiMessages] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [sendingEmail, setSendingEmail] = useState({});

  async function loadDebts() {
    try {
      const response = await api.get("/debts");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar lembretes.");
    }
  }

  useEffect(() => {
    loadDebts();
  }, []);

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function getDaysToDueDate(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = due - today;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getReminderStatus(debt) {
    const days = getDaysToDueDate(debt.dueDate);

    if (debt.status === "QUITADA") {
      return "QUITADA";
    }

    if (days < 0) {
      return "VENCIDA";
    }

    if (days === 0) {
      return "VENCE_HOJE";
    }

    if (days <= 3) {
      return "PROXIMA";
    }

    return "FUTURA";
  }

  const filteredDebts = useMemo(() => {
    return debts.filter((debt) => {
      if (debt.status === "QUITADA" || debt.status === "CANCELADA") {
        return false;
      }

      const status = getReminderStatus(debt);

      if (filter === "TODOS") {
        return true;
      }

      return status === filter;
    });
  }, [debts, filter]);

  async function generateAiMessage(debt, tone = "amigavel") {
    try {
      setLoadingAi((prev) => ({
        ...prev,
        [debt.id]: true
      }));

      const response = await api.post("/ai/generate-collection-message", {
        debtId: debt.id,
        tone
      });

      setAiMessages((prev) => ({
        ...prev,
        [debt.id]: response.data.message
      }));
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Erro ao gerar mensagem IA."
      );
    } finally {
      setLoadingAi((prev) => ({
        ...prev,
        [debt.id]: false
      }));
    }
  }

  function createWhatsappMessage(debt) {
    const days = getDaysToDueDate(debt.dueDate);
    const debtorName = debt.debtor?.fullName || "tudo bem";

    if (days < 0) {
      return `Olá, ${debtorName}!

Estamos entrando em contato para lembrar que existe uma cobrança vencida em seu nome.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}

Pedimos, por gentileza, que regularize o pagamento ou entre em contato para negociação.

Atenciosamente,
Sistema de Cobrança Digital`;
    }

    if (days === 0) {
      return `Olá, ${debtorName}!

Passando para lembrar que sua cobrança vence hoje.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Sistema de Cobrança Digital`;
    }

    return `Olá, ${debtorName}!

Este é um lembrete amigável sobre uma cobrança próxima do vencimento.

Descrição: ${debt.description}
Valor: ${formatCurrency(debt.currentAmount)}
Vencimento: ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}

Faltam ${days} dia(s) para o vencimento.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  function createEmailSubject(debt) {
    return `Lembrete de cobrança - ${debt.description}`;
  }

  function getFinalMessage(debt) {
    return aiMessages[debt.id] || createWhatsappMessage(debt);
  }

  async function sendWhatsapp(debt) {
    const phone = onlyNumbers(debt.debtor?.whatsapp || debt.debtor?.phone);

    if (!phone) {
      alert("Este devedor não possui WhatsApp ou telefone cadastrado.");
      return;
    }

    const finalMessage = getFinalMessage(debt);

    try {
      await api.post("/reminder-history", {
        debtId: debt.id,
        channel: "WHATSAPP",
        tone: aiMessages[debt.id] ? "ia" : "manual",
        message: finalMessage,
        status: "ENVIADO"
      });
    } catch (error) {
      console.error("Erro ao registrar histórico do WhatsApp:", error);
    }

    const message = encodeURIComponent(finalMessage);
    const url = `https://wa.me/55${phone}?text=${message}`;

    window.open(url, "_blank");
  }

  async function sendEmail(debt) {
    if (!debt.debtor?.email) {
      alert("Este devedor não possui e-mail cadastrado.");
      return;
    }

    try {
      setSendingEmail((prev) => ({
        ...prev,
        [debt.id]: true
      }));

      await api.post("/email/send-debt-email", {
        debtId: debt.id,
        subject: createEmailSubject(debt),
        message: getFinalMessage(debt)
      });

      alert("E-mail enviado com sucesso!");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Erro ao enviar e-mail."
      );
    } finally {
      setSendingEmail((prev) => ({
        ...prev,
        [debt.id]: false
      }));
    }
  }

  async function copyMessage(debt) {
    try {
      await navigator.clipboard.writeText(getFinalMessage(debt));
      alert("Mensagem copiada!");
    } catch (error) {
      alert("Não foi possível copiar a mensagem.");
    }
  }

  function clearAiMessage(debtId) {
    setAiMessages((prev) => {
      const updated = { ...prev };
      delete updated[debtId];
      return updated;
    });
  }

  function getStatusLabel(debt) {
    const status = getReminderStatus(debt);

    if (status === "VENCIDA") return "Vencida";
    if (status === "VENCE_HOJE") return "Vence hoje";
    if (status === "PROXIMA") return "Próxima";
    if (status === "FUTURA") return "Futura";

    return status;
  }

  function getStatusStyle(debt) {
    const status = getReminderStatus(debt);

    if (status === "VENCIDA") {
      return {
        background: "#fee2e2",
        color: "#991b1b"
      };
    }

    if (status === "VENCE_HOJE") {
      return {
        background: "#fef3c7",
        color: "#92400e"
      };
    }

    if (status === "PROXIMA") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8"
      };
    }

    return {
      background: "#dcfce7",
      color: "#166534"
    };
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Lembretes de Cobrança</h1>

          <p style={subtitle}>
            Envie lembretes por WhatsApp ou e-mail real e gere mensagens com IA.
          </p>
        </div>

        <button onClick={loadDebts} className="btn-primary">
          Atualizar
        </button>
      </div>

      <div style={filterBox}>
        <button
          onClick={() => setFilter("TODOS")}
          style={filter === "TODOS" ? activeFilter : filterButton}
        >
          Todos
        </button>

        <button
          onClick={() => setFilter("PROXIMA")}
          style={filter === "PROXIMA" ? activeFilter : filterButton}
        >
          Próximas
        </button>

        <button
          onClick={() => setFilter("VENCE_HOJE")}
          style={filter === "VENCE_HOJE" ? activeFilter : filterButton}
        >
          Vence hoje
        </button>

        <button
          onClick={() => setFilter("VENCIDA")}
          style={filter === "VENCIDA" ? activeFilter : filterButton}
        >
          Vencidas
        </button>
      </div>

      <div style={cardsGrid}>
        {filteredDebts.map((debt) => (
          <div key={debt.id} style={card}>
            <div style={cardHeader}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {debt.debtor?.fullName || "Devedor não informado"}
                </h3>

                <p style={muted}>
                  CPF: {debt.debtor?.cpf || "Não informado"}
                </p>
              </div>

              <span
                style={{
                  ...statusPill,
                  ...getStatusStyle(debt)
                }}
              >
                {getStatusLabel(debt)}
              </span>
            </div>

            <div style={detailsBox}>
              <p>
                <strong>Dívida:</strong> {debt.description}
              </p>

              <p>
                <strong>Valor:</strong> {formatCurrency(debt.currentAmount)}
              </p>

              <p>
                <strong>Vencimento:</strong>{" "}
                {new Date(debt.dueDate).toLocaleDateString("pt-BR")}
              </p>

              <p>
                <strong>Contato:</strong>{" "}
                {debt.debtor?.whatsapp || debt.debtor?.phone || "Não informado"}
              </p>

              <p>
                <strong>E-mail:</strong>{" "}
                {debt.debtor?.email || "Não informado"}
              </p>
            </div>

            <div style={aiBox}>
              <label style={labelStyle}>
                Gerar mensagem com IA
              </label>

              <div style={aiActions}>
                <select
                  onChange={(e) => generateAiMessage(debt, e.target.value)}
                  style={toneSelect}
                  defaultValue=""
                  disabled={loadingAi[debt.id]}
                >
                  <option value="" disabled>
                    Escolha o tom
                  </option>

                  <option value="amigavel">Amigável</option>
                  <option value="formal">Formal</option>
                  <option value="urgente">Urgente</option>
                  <option value="negociacao">Negociação</option>
                  <option value="negativacao">Negativação</option>
                </select>

                {aiMessages[debt.id] && (
                  <button
                    type="button"
                    onClick={() => clearAiMessage(debt.id)}
                    style={clearAiButton}
                  >
                    Usar padrão
                  </button>
                )}

                {loadingAi[debt.id] && (
                  <span style={loadingText}>
                    Gerando IA...
                  </span>
                )}
              </div>
            </div>

            <textarea
              value={getFinalMessage(debt)}
              readOnly
              style={messageBox}
            />

            <div style={actions}>
              <button
                onClick={() => sendWhatsapp(debt)}
                style={whatsappButton}
              >
                WhatsApp
              </button>

              <button
                onClick={() => sendEmail(debt)}
                style={{
                  ...emailButton,
                  opacity: sendingEmail[debt.id] ? 0.7 : 1
                }}
                disabled={sendingEmail[debt.id]}
              >
                {sendingEmail[debt.id] ? "Enviando..." : "E-mail real"}
              </button>

              <button
                onClick={() => copyMessage(debt)}
                className="btn-primary"
              >
                Copiar
              </button>
            </div>
          </div>
        ))}

        {filteredDebts.length === 0 && (
          <div style={emptyBox}>
            <h3>Nenhum lembrete encontrado.</h3>
            <p>Não há cobranças para o filtro selecionado.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const headerBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24
};

const subtitle = {
  color: "#6b7280",
  marginTop: 8
};

const filterBox = {
  display: "flex",
  gap: 10,
  marginBottom: 24,
  flexWrap: "wrap"
};

const filterButton = {
  background: "#fff",
  color: "#374151",
  border: "1px solid #d1d5db",
  padding: "10px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 700
};

const activeFilter = {
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #2563eb",
  padding: "10px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 700
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
  gap: 20
};

const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16
};

const muted = {
  color: "#6b7280",
  margin: "6px 0 0"
};

const statusPill = {
  display: "inline-block",
  height: "fit-content",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800
};

const detailsBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  marginBottom: 16
};

const aiBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  marginBottom: 14
};

const aiActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 8
};

const labelStyle = {
  fontWeight: 700,
  color: "#374151",
  fontSize: 14
};

const toneSelect = {
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontWeight: 700,
  minWidth: 180
};

const clearAiButton = {
  background: "#6b7280",
  color: "#fff",
  border: "none",
  padding: "12px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const loadingText = {
  color: "#2563eb",
  fontWeight: 700,
  display: "flex",
  alignItems: "center"
};

const messageBox = {
  width: "100%",
  minHeight: 230,
  padding: 12,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  marginBottom: 14,
  lineHeight: 1.5
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
};

const whatsappButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const emailButton = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const emptyBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  color: "#6b7280"
};

export default Reminders;