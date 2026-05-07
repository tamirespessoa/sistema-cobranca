import { useEffect, useState } from "react";

import api from "../services/api";
import MainLayout from "../layouts/MainLayout";

function Dashboard() {
  const [data, setData] = useState(null);

  async function loadDashboard() {
    try {
      const response = await api.get("/dashboard/financial");
      setData(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dashboard.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (!data) {
    return (
      <MainLayout>
        <h2>Carregando dashboard...</h2>
      </MainLayout>
    );
  }

  const cards = data.cards;

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Dashboard Financeiro</h1>
          <p style={subtitle}>
            Acompanhe valores a receber, recebidos, vencidos e a situação geral das cobranças.
          </p>
        </div>

        <button onClick={loadDashboard} className="btn-primary">
          Atualizar
        </button>
      </div>

      <div style={cardsGrid}>
        <FinanceCard
          title="Total a Receber"
          value={formatCurrency(cards.totalToReceive)}
          description="Valor total das dívidas cadastradas"
          color="#2563eb"
        />

        <FinanceCard
          title="Total Recebido"
          value={formatCurrency(cards.totalReceived)}
          description="Pagamentos confirmados"
          color="#16a34a"
        />

        <FinanceCard
          title="Total em Aberto"
          value={formatCurrency(cards.totalOpen)}
          description="Saldo pendente de recebimento"
          color="#f59e0b"
        />

        <FinanceCard
          title="Total Vencido"
          value={formatCurrency(cards.totalOverdue)}
          description="Valores vencidos não quitados"
          color="#dc2626"
        />
      </div>

      <div style={summaryGrid}>
        <SmallCard title="Total de Dívidas" value={cards.totalDebts} />
        <SmallCard title="Abertas" value={cards.openDebts} />
        <SmallCard title="Parcialmente Pagas" value={cards.partialDebts} />
        <SmallCard title="Quitadas" value={cards.paidDebts} />
        <SmallCard title="Vencidas" value={cards.overdueDebts} />
      </div>

      <div style={recentBox}>
        <h2 style={{ marginTop: 0 }}>Dívidas recentes</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Devedor</Th>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {data.recentDebts?.map((debt) => (
              <tr key={debt.id}>
                <Td>{debt.debtorName}</Td>
                <Td>{debt.description}</Td>
                <Td>{formatCurrency(debt.amount)}</Td>
                <Td>{new Date(debt.dueDate).toLocaleDateString("pt-BR")}</Td>
                <Td>
                  <span className="status-pill">
                    {debt.status}
                  </span>
                </Td>
              </tr>
            ))}

            {(!data.recentDebts || data.recentDebts.length === 0) && (
              <tr>
                <Td colSpan="5">Nenhuma dívida recente encontrada.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function FinanceCard({ title, value, description, color }) {
  return (
    <div style={financeCard}>
      <div
        style={{
          ...cardIcon,
          background: color
        }}
      >
        R$
      </div>

      <p style={cardTitle}>{title}</p>

      <h2 style={cardValue}>{value}</h2>

      <p style={cardDescription}>{description}</p>
    </div>
  );
}

function SmallCard({ title, value }) {
  return (
    <div style={smallCard}>
      <p style={smallTitle}>{title}</p>
      <h2 style={smallValue}>{value}</h2>
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
  marginTop: 8,
  maxWidth: 760
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 20
};

const financeCard = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const cardIcon = {
  width: 46,
  height: 46,
  borderRadius: 14,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  marginBottom: 18
};

const cardTitle = {
  color: "#6b7280",
  margin: 0,
  fontWeight: 700
};

const cardValue = {
  fontSize: 28,
  margin: "10px 0",
  color: "#111827"
};

const cardDescription = {
  color: "#9ca3af",
  margin: 0,
  fontSize: 13
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 16,
  marginTop: 24
};

const smallCard = {
  background: "#fff",
  borderRadius: 14,
  padding: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)"
};

const smallTitle = {
  color: "#6b7280",
  margin: 0,
  fontSize: 13,
  fontWeight: 700
};

const smallValue = {
  margin: "8px 0 0",
  fontSize: 24
};

const recentBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  marginTop: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

export default Dashboard;