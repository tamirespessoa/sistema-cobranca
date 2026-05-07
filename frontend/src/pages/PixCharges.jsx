import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function PixCharges() {
  const [debts, setDebts] = useState([]);
  const [pixCharges, setPixCharges] = useState([]);
  const [debtId, setDebtId] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDebts() {
    try {
      const response = await api.get("/debts");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dívidas.");
    }
  }

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
    loadDebts();
    loadPixCharges();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  async function generatePix(e) {
    e.preventDefault();

    if (!debtId) {
      alert("Selecione uma dívida.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/pix", {
        debtId
      });

      alert("Pix gerado com sucesso!");

      setDebtId("");
      loadPixCharges();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao gerar Pix.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      alert("Código Pix copiado!");
    } catch (error) {
      alert("Não foi possível copiar o código.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Cobranças Pix</h1>
          <p style={subtitle}>
            Gere QR Code Pix e código copia e cola para cobranças em aberto.
          </p>
        </div>

        <button onClick={loadPixCharges} className="btn-primary">
          Atualizar
        </button>
      </div>

      <form onSubmit={generatePix} style={formBox}>
        <h2 style={{ marginTop: 0 }}>Gerar nova cobrança Pix</h2>

        <label style={labelStyle}>
          Selecione a dívida
          <select
            value={debtId}
            onChange={(e) => setDebtId(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">Selecione uma dívida</option>

            {debts
              .filter((debt) => debt.status !== "QUITADA" && debt.status !== "CANCELADA")
              .map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.debtor?.fullName} - {debt.description} - {formatCurrency(debt.currentAmount)}
                </option>
              ))}
          </select>
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Gerando Pix..." : "Gerar Pix"}
        </button>
      </form>

      <div style={sectionHeader}>
        <h2 style={{ margin: 0 }}>Pix gerados</h2>
        <span style={countBadge}>{pixCharges.length} cobrança(s)</span>
      </div>

      <div style={cardsGrid}>
        {pixCharges.map((pix) => (
          <div key={pix.id} style={card}>
            <div style={cardTop}>
              <div>
                <h3 style={{ margin: 0 }}>{pix.debt?.debtor?.fullName}</h3>
                <p style={{ color: "#6b7280", marginTop: 6 }}>
                  {pix.debt?.description}
                </p>
              </div>

              <span style={statusPill}>{pix.status}</span>
            </div>

            <div style={amountBox}>
              <span style={{ color: "#6b7280", fontWeight: 700 }}>Valor Pix</span>
              <strong style={{ fontSize: 24 }}>{formatCurrency(pix.amount)}</strong>
            </div>

            {pix.qrCode && (
              <div style={qrBox}>
                <img
                  src={pix.qrCode}
                  alt="QR Code Pix"
                  style={{
                    width: 220,
                    height: 220,
                    display: "block"
                  }}
                />
              </div>
            )}

            <label style={labelStyle}>
              Código Pix copia e cola
              <textarea
                value={pix.copyPasteCode || ""}
                readOnly
                style={{
                  ...inputStyle,
                  height: 110,
                  fontSize: 12
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => copyCode(pix.copyPasteCode)}
              className="btn-primary"
            >
              Copiar código Pix
            </button>
          </div>
        ))}

        {pixCharges.length === 0 && (
          <div style={emptyBox}>
            <h3>Nenhuma cobrança Pix gerada.</h3>
            <p>Gere uma cobrança Pix a partir de uma dívida em aberto.</p>
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

const formBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  marginBottom: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
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

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18
};

const countBadge = {
  background: "#eff6ff",
  color: "#2563eb",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
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

const amountBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18
};

const qrBox = {
  background: "#f8fafc",
  borderRadius: 16,
  padding: 18,
  display: "flex",
  justifyContent: "center",
  marginBottom: 18
};

const emptyBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  color: "#6b7280"
};

export default PixCharges;