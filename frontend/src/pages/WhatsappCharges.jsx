import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function WhatsappCharges() {
  const [pixCharges, setPixCharges] = useState([]);

  async function loadPixCharges() {
    try {
      const response = await api.get("/pix");
      setPixCharges(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar cobranças Pix.");
    }
  }

  useEffect(() => {
    loadPixCharges();
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

  function createMessage(pix) {
    const debtor = pix.debt?.debtor;
    const debt = pix.debt;

    return `Olá, ${debtor?.fullName || "tudo bem"}!

Identificamos uma cobrança em aberto em seu nome.

Descrição: ${debt?.description}
Valor: ${formatCurrency(pix.amount)}
Vencimento: ${new Date(debt?.dueDate).toLocaleDateString("pt-BR")}

Para facilitar o pagamento, segue o Pix copia e cola:

${pix.copyPasteCode}

Após o pagamento, envie o comprovante por aqui para conferência.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  function openWhatsapp(pix) {
    const debtor = pix.debt?.debtor;
    const phone = onlyNumbers(debtor?.whatsapp || debtor?.phone);

    if (!phone) {
      alert("Este devedor não possui WhatsApp/telefone cadastrado.");
      return;
    }

    const message = encodeURIComponent(createMessage(pix));
    const url = `https://wa.me/55${phone}?text=${message}`;

    window.open(url, "_blank");
  }

  async function copyMessage(pix) {
    try {
      await navigator.clipboard.writeText(createMessage(pix));
      alert("Mensagem copiada!");
    } catch (error) {
      alert("Não foi possível copiar a mensagem.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Cobrança por WhatsApp</h1>
          <p style={subtitle}>
            Envie mensagens de cobrança com valor, vencimento e Pix copia e cola.
          </p>
        </div>

        <button onClick={loadPixCharges} className="btn-primary">
          Atualizar
        </button>
      </div>

      <div style={infoBox}>
        <strong>Importante:</strong> esta versão abre o WhatsApp com a mensagem preenchida.
        Depois podemos integrar uma API oficial para envio automático.
      </div>

      <div style={cardsGrid}>
        {pixCharges.map((pix) => (
          <div key={pix.id} style={card}>
            <div style={cardTop}>
              <div>
                <h3 style={{ margin: 0 }}>{pix.debt?.debtor?.fullName}</h3>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  {pix.debt?.debtor?.whatsapp || pix.debt?.debtor?.phone || "Telefone não informado"}
                </p>
              </div>

              <span style={statusPill}>{pix.status}</span>
            </div>

            <div style={detailsBox}>
              <p>
                <strong>Dívida:</strong> {pix.debt?.description}
              </p>

              <p>
                <strong>Valor:</strong> {formatCurrency(pix.amount)}
              </p>

              <p>
                <strong>Vencimento:</strong>{" "}
                {new Date(pix.debt?.dueDate).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <label style={labelStyle}>
              Mensagem que será enviada
              <textarea
                value={createMessage(pix)}
                readOnly
                style={{
                  ...inputStyle,
                  minHeight: 210,
                  fontSize: 13,
                  lineHeight: 1.5
                }}
              />
            </label>

            <div style={actions}>
              <button
                type="button"
                onClick={() => openWhatsapp(pix)}
                style={whatsappButton}
              >
                Enviar WhatsApp
              </button>

              <button
                type="button"
                onClick={() => copyMessage(pix)}
                className="btn-primary"
              >
                Copiar mensagem
              </button>
            </div>
          </div>
        ))}

        {pixCharges.length === 0 && (
          <div style={emptyBox}>
            <h3>Nenhuma cobrança Pix encontrada.</h3>
            <p>Gere uma cobrança Pix primeiro para poder enviar pelo WhatsApp.</p>
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

const infoBox = {
  background: "#eff6ff",
  color: "#1e40af",
  border: "1px solid #bfdbfe",
  padding: 16,
  borderRadius: 14,
  marginBottom: 24
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
  gap: 20
};

const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16
};

const statusPill = {
  height: "fit-content",
  background: "#dcfce7",
  color: "#166534",
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
  marginBottom: 18
};

const labelStyle = {
  fontWeight: 700,
  color: "#374151",
  fontSize: 14
};

const inputStyle = {
  width: "100%",
  padding: 11,
  marginTop: 7,
  marginBottom: 14,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  outline: "none"
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

const emptyBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  color: "#6b7280"
};

export default WhatsappCharges;