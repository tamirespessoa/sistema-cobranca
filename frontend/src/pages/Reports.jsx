import { useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Reports() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: ""
  });

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  function handleChange(e) {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function buildParams() {
    const params = new URLSearchParams();

    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }

    return params.toString();
  }

  async function loadReport(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.get(`/reports/financial?${buildParams()}`);

      setReport(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar relatório financeiro.");
    } finally {
      setLoading(false);
    }
  }

  async function exportPDF() {
    try {
      setExporting(true);

      const response = await api.get(`/reports/financial/pdf?${buildParams()}`);

      const fileUrl = response.data.fileUrl;

      if (!fileUrl) {
        alert("PDF gerado, mas o link não foi retornado.");
        return;
      }

      window.open(`http://localhost:3001${fileUrl}`, "_blank");
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar relatório em PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Relatórios Financeiros</h1>
          <p style={subtitle}>
            Filtre por período para acompanhar valores recebidos, dívidas criadas e saldo em aberto.
          </p>
        </div>
      </div>

      <form onSubmit={loadReport} style={formBox}>
        <h2 style={{ marginTop: 0 }}>Filtro por período</h2>

        <div style={grid}>
          <label style={labelStyle}>
            Data inicial
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Data final
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={actions}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Gerando relatório..." : "Gerar Relatório"}
          </button>

          <button
            type="button"
            onClick={exportPDF}
            style={pdfButton}
            disabled={exporting}
          >
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>
      </form>

      {report && (
        <>
          <div style={cardsGrid}>
            <ReportCard
              title="Total Recebido"
              value={formatCurrency(report.summary.totalReceived)}
              description="Pagamentos confirmados no período"
              color="#16a34a"
            />

            <ReportCard
              title="Dívidas Criadas"
              value={formatCurrency(report.summary.totalDebtsCreated)}
              description="Valor total de dívidas cadastradas no período"
              color="#2563eb"
            />

            <ReportCard
              title="Saldo em Aberto"
              value={formatCurrency(report.summary.totalOpen)}
              description="Valor ainda pendente das dívidas do período"
              color="#f59e0b"
            />

            <ReportCard
              title="Pagamentos"
              value={report.summary.paymentsCount}
              description="Quantidade de pagamentos no período"
              color="#7c3aed"
            />
          </div>

          <div style={tableBox}>
            <div style={tableHeader}>
              <h2 style={{ margin: 0 }}>Pagamentos do período</h2>
              <span style={countBadge}>
                {report.payments.length} pagamento(s)
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th>Devedor</Th>
                  <Th>Dívida</Th>
                  <Th>Valor</Th>
                  <Th>Forma</Th>
                  <Th>Data</Th>
                </tr>
              </thead>

              <tbody>
                {report.payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td>{payment.debt?.debtor?.fullName || "Não informado"}</Td>
                    <Td>{payment.debt?.description || "Não informado"}</Td>
                    <Td>{formatCurrency(payment.amount)}</Td>
                    <Td>{payment.paymentMethod}</Td>
                    <Td>{new Date(payment.paymentDate).toLocaleDateString("pt-BR")}</Td>
                  </tr>
                ))}

                {report.payments.length === 0 && (
                  <tr>
                    <Td colSpan="5">Nenhum pagamento encontrado no período.</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={tableBox}>
            <div style={tableHeader}>
              <h2 style={{ margin: 0 }}>Dívidas criadas no período</h2>
              <span style={countBadge}>
                {report.debts.length} dívida(s)
              </span>
            </div>

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
                {report.debts.map((debt) => (
                  <tr key={debt.id}>
                    <Td>{debt.debtor?.fullName || "Não informado"}</Td>
                    <Td>{debt.description}</Td>
                    <Td>{formatCurrency(debt.currentAmount)}</Td>
                    <Td>{new Date(debt.dueDate).toLocaleDateString("pt-BR")}</Td>
                    <Td>
                      <span className="status-pill">
                        {debt.status}
                      </span>
                    </Td>
                  </tr>
                ))}

                {report.debts.length === 0 && (
                  <tr>
                    <Td colSpan="5">Nenhuma dívida encontrada no período.</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </MainLayout>
  );
}

function ReportCard({ title, value, description, color }) {
  return (
    <div style={reportCard}>
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

const formBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  marginBottom: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16
};

const actions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
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

const pdfButton = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 20,
  marginBottom: 24
};

const reportCard = {
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
  fontSize: 26,
  margin: "10px 0",
  color: "#111827"
};

const cardDescription = {
  color: "#9ca3af",
  margin: 0,
  fontSize: 13
};

const tableBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  marginBottom: 24,
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
  background: "#eff6ff",
  color: "#2563eb",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13
};

export default Reports;