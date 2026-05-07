import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function ReminderHistory() {
  const [histories, setHistories] = useState([]);

  async function loadHistory() {
    try {
      const response = await api.get("/reminder-history");

      setHistories(response.data);
    } catch (error) {
      console.error(error);

      alert("Erro ao carregar histórico.");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR");
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">
            Histórico de Cobranças
          </h1>

          <p style={subtitle}>
            Histórico completo de mensagens automáticas e IA.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="btn-primary"
        >
          Atualizar
        </button>
      </div>

      <div style={tableBox}>
        <table style={table}>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Devedor</Th>
              <Th>Dívida</Th>
              <Th>Canal</Th>
              <Th>Tom IA</Th>
              <Th>Status</Th>
              <Th>Mensagem</Th>
            </tr>
          </thead>

          <tbody>
            {histories.map((history) => (
              <tr key={history.id}>
                <Td>
                  {formatDate(history.createdAt)}
                </Td>

                <Td>
                  {history.debt?.debtor?.fullName}
                </Td>

                <Td>
                  {history.debt?.description}
                </Td>

                <Td>
                  {history.channel}
                </Td>

                <Td>
                  {history.tone}
                </Td>

                <Td>
                  <span style={statusPill}>
                    {history.status}
                  </span>
                </Td>

                <Td>
                  <div style={messageBox}>
                    {history.message}
                  </div>
                </Td>
              </tr>
            ))}

            {histories.length === 0 && (
              <tr>
                <Td colSpan="7">
                  Nenhum histórico encontrado.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function Th({ children }) {
  return (
    <th style={thStyle}>
      {children}
    </th>
  );
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} style={tdStyle}>
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

const tableBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  overflowX: "auto",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const table = {
  width: "100%",
  borderCollapse: "collapse"
};

const thStyle = {
  textAlign: "left",
  padding: 14,
  borderBottom: "1px solid #e5e7eb"
};

const tdStyle = {
  padding: 14,
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "top"
};

const statusPill = {
  background: "#dcfce7",
  color: "#166534",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700
};

const messageBox = {
  maxWidth: 320,
  whiteSpace: "pre-wrap",
  lineHeight: 1.5
};

export default ReminderHistory;