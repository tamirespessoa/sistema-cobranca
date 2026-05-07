import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Negative() {
  const [debts, setDebts] = useState([]);

  async function loadOverdueDebts() {
    try {
      const response = await api.get("/negative/overdue");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar inadimplentes.");
    }
  }

  useEffect(() => {
    loadOverdueDebts();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  async function registerWarning(debtId) {
    try {
      await api.post("/negative/warning", {
        debtId,
        notes: "Aviso de negativação enviado ao devedor."
      });

      alert("Aviso registrado com sucesso!");
      loadOverdueDebts();
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar aviso.");
    }
  }

  async function markReady(debtId) {
    const confirmAction = window.confirm(
      "Deseja marcar esta dívida como apta para negativação? Use apenas após conferir documentos, avisos e regras aplicáveis."
    );

    if (!confirmAction) return;

    try {
      await api.post("/negative/ready", {
        debtId,
        notes: "Dívida marcada como apta para negativação."
      });

      alert("Dívida marcada como apta para negativação.");
      loadOverdueDebts();
    } catch (error) {
      console.error(error);
      alert("Erro ao marcar dívida.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Inadimplentes / Negativação</h1>
          <p style={subtitle}>
            Acompanhe dívidas vencidas, registre avisos e prepare casos para negativação.
          </p>
        </div>

        <button onClick={loadOverdueDebts} className="btn-primary">
          Atualizar
        </button>
      </div>

      <div style={warningBox}>
        <strong>Atenção:</strong> esta tela apenas organiza e registra a situação da cobrança.
        A negativação em SPC/Serasa deve seguir regras legais, aviso prévio e integração/contrato oficial.
      </div>

      <div style={summaryGrid}>
        <SummaryCard title="Dívidas vencidas" value={debts.length} />
        <SummaryCard
          title="Valor vencido"
          value={formatCurrency(
            debts.reduce((sum, debt) => sum + Number(debt.currentAmount || 0), 0)
          )}
        />
      </div>

      <div style={tableBox}>
        <div style={tableHeader}>
          <h2 style={{ margin: 0 }}>Lista de inadimplentes</h2>
          <span style={countBadge}>{debts.length} registro(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Devedor</Th>
              <Th>CPF</Th>
              <Th>Dívida</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id}>
                <Td>{debt.debtor?.fullName || "Não informado"}</Td>
                <Td>{debt.debtor?.cpf || "Não informado"}</Td>
                <Td>{debt.description}</Td>
                <Td>{formatCurrency(debt.currentAmount)}</Td>
                <Td>{new Date(debt.dueDate).toLocaleDateString("pt-BR")}</Td>
                <Td>
                  <span style={statusPill}>
                    {debt.status}
                  </span>
                </Td>
                <Td>
                  <div style={actions}>
                    <button
                      onClick={() => registerWarning(debt.id)}
                      style={warningButton}
                    >
                      Registrar aviso
                    </button>

                    <button
                      onClick={() => markReady(debt.id)}
                      style={dangerButton}
                    >
                      Apto negativação
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {debts.length === 0 && (
              <tr>
                <Td colSpan="7">
                  Nenhuma dívida vencida encontrada.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div style={summaryCard}>
      <p style={summaryTitle}>{title}</p>
      <h2 style={summaryValue}>{value}</h2>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: 14, borderBottom: "1px solid #e5e7eb" }}>
      {children}
    </th>
  );
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} style={{ padding: 14, borderBottom: "1px solid #f3f4f6" }}>
      {children}
    </td>
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

const warningBox = {
  background: "#fff7ed",
  color: "#9a3412",
  border: "1px solid #fed7aa",
  padding: 16,
  borderRadius: 14,
  marginBottom: 24,
  lineHeight: 1.5
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 18,
  marginBottom: 24
};

const summaryCard = {
  background: "#fff",
  padding: 22,
  borderRadius: 18,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const summaryTitle = {
  margin: 0,
  color: "#6b7280",
  fontWeight: 700
};

const summaryValue = {
  margin: "10px 0 0",
  fontSize: 28,
  color: "#111827"
};

const tableBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const tableHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18
};

const countBadge = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13
};

const statusPill = {
  display: "inline-block",
  background: "#fee2e2",
  color: "#991b1b",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800
};

const actions = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const warningButton = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const dangerButton = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

export default Negative;