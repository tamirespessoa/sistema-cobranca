import { useEffect, useMemo, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

const emptyForm = {
  debtId: "",
  negotiatedAmount: "",
  installments: "1",
  agreementDate: "",
  firstDueDate: "",
  notes: ""
};

function Agreements() {
  const [debts, setDebts] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  async function loadDebts() {
    try {
      const response = await api.get("/debts");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dívidas.");
    }
  }

  async function loadAgreements() {
    try {
      const response = await api.get("/agreements");
      setAgreements(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar acordos.");
    }
  }

  useEffect(() => {
    loadDebts();
    loadAgreements();
  }, []);

  const availableDebts = debts.filter((debt) => {
    return debt.status !== "QUITADA" && debt.status !== "CANCELADA";
  });

  const filteredAgreements = useMemo(() => {
    return agreements.filter((agreement) => {
      const debtorName = agreement.debt?.debtor?.fullName?.toLowerCase() || "";
      const description = agreement.debt?.description?.toLowerCase() || "";
      const cpf = agreement.debt?.debtor?.cpf || "";
      const text = search.toLowerCase();

      return (
        debtorName.includes(text) ||
        description.includes(text) ||
        cpf.includes(search)
      );
    });
  }, [agreements, search]);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatDate(date) {
    if (!date) return "Não informado";
    return new Date(date).toLocaleDateString("pt-BR");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/agreements", form);

      alert("Acordo criado com sucesso!");

      setForm(emptyForm);
      loadAgreements();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao criar acordo.");
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/agreements/${id}/status`, { status });

      alert("Status atualizado com sucesso!");
      loadAgreements();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao atualizar status.");
    }
  }

  async function updateInstallmentStatus(id, status) {
    try {
      await api.patch(`/agreements/installments/${id}/status`, { status });

      alert("Parcela atualizada com sucesso!");
      loadAgreements();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao atualizar parcela.");
    }
  }

  async function deleteAgreement(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este acordo? As parcelas também serão excluídas."
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/agreements/${id}`);

      alert("Acordo excluído com sucesso!");
      loadAgreements();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao excluir acordo.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Acordos e Negociações</h1>
          <p style={subtitle}>
            Registre renegociações, gere parcelas automáticas e acompanhe pagamentos.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        <h2 style={{ marginTop: 0 }}>Novo Acordo</h2>

        <div style={grid}>
          <label style={labelStyle}>
            Dívida
            <select
              name="debtId"
              value={form.debtId}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Selecione uma dívida</option>

              {availableDebts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.debtor?.fullName} - {debt.description} -{" "}
                  {formatCurrency(debt.currentAmount)}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Valor negociado"
            name="negotiatedAmount"
            value={form.negotiatedAmount}
            onChange={handleChange}
            required
            type="number"
          />

          <Input
            label="Quantidade de parcelas"
            name="installments"
            value={form.installments}
            onChange={handleChange}
            type="number"
          />

          <Input
            label="Data do acordo"
            name="agreementDate"
            value={form.agreementDate}
            onChange={handleChange}
            type="date"
          />

          <Input
            label="Primeiro vencimento"
            name="firstDueDate"
            value={form.firstDueDate}
            onChange={handleChange}
            type="date"
          />
        </div>

        <label style={labelStyle}>
          Observações
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 90 }}
          />
        </label>

        <button type="submit" className="btn-primary">
          Salvar Acordo
        </button>
      </form>

      <div style={tableBox}>
        <div style={tableHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Acordos cadastrados</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
              Consulte acordos, parcelas, vencimentos e status.
            </p>
          </div>

          <span style={countBadge}>
            {filteredAgreements.length} acordo(s)
          </span>
        </div>

        <input
          placeholder="Buscar por devedor, CPF ou dívida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <div style={agreementsList}>
          {filteredAgreements.map((agreement) => (
            <div key={agreement.id} style={agreementCard}>
              <div style={agreementHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {agreement.debt?.debtor?.fullName}
                  </h3>
                  <p style={muted}>
                    CPF: {agreement.debt?.debtor?.cpf || "Não informado"}
                  </p>
                  <p style={muted}>
                    Dívida: {agreement.debt?.description}
                  </p>
                </div>

                <span style={statusPill}>
                  {agreement.status}
                </span>
              </div>

              <div style={summaryGrid}>
                <Info label="Valor original" value={formatCurrency(agreement.originalAmount)} />
                <Info label="Valor negociado" value={formatCurrency(agreement.negotiatedAmount)} />
                <Info label="Parcelas" value={agreement.installments} />
                <Info label="Data do acordo" value={formatDate(agreement.agreementDate)} />
                <Info label="1º vencimento" value={formatDate(agreement.firstDueDate)} />
              </div>

              {agreement.notes && (
                <p style={notesBox}>
                  <strong>Observações:</strong> {agreement.notes}
                </p>
              )}

              <h4>Parcelas do acordo</h4>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <Th>Parcela</Th>
                    <Th>Valor</Th>
                    <Th>Vencimento</Th>
                    <Th>Status</Th>
                    <Th>Pago em</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>

                <tbody>
                  {(agreement.installmentItems || []).map((item) => (
                    <tr key={item.id}>
                      <Td>{item.installmentNumber}</Td>
                      <Td>{formatCurrency(item.amount)}</Td>
                      <Td>{formatDate(item.dueDate)}</Td>
                      <Td>
                        <span
                          style={{
                            ...smallStatus,
                            background: item.status === "PAGO" ? "#dcfce7" : "#fef3c7",
                            color: item.status === "PAGO" ? "#166534" : "#92400e"
                          }}
                        >
                          {item.status}
                        </span>
                      </Td>
                      <Td>{item.paidAt ? formatDate(item.paidAt) : "—"}</Td>
                      <Td>
                        <div style={actions}>
                          <button
                            onClick={() => updateInstallmentStatus(item.id, "PAGO")}
                            style={greenButton}
                          >
                            Pagar
                          </button>

                          <button
                            onClick={() => updateInstallmentStatus(item.id, "PENDENTE")}
                            style={orangeButton}
                          >
                            Pendente
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}

                  {(!agreement.installmentItems || agreement.installmentItems.length === 0) && (
                    <tr>
                      <Td colSpan="6">Nenhuma parcela gerada.</Td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={cardActions}>
                <button
                  onClick={() => updateStatus(agreement.id, "ATIVO")}
                  style={blueButton}
                >
                  Ativo
                </button>

                <button
                  onClick={() => updateStatus(agreement.id, "QUITADO")}
                  style={greenButton}
                >
                  Quitar acordo
                </button>

                <button
                  onClick={() => updateStatus(agreement.id, "CANCELADO")}
                  style={orangeButton}
                >
                  Cancelar acordo
                </button>

                <button
                  onClick={() => deleteAgreement(agreement.id)}
                  style={deleteButton}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {filteredAgreements.length === 0 && (
            <div style={emptyBox}>
              Nenhum acordo encontrado.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function Input({ label, name, value, onChange, required, type = "text" }) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoBox}>
      <span style={infoLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Th({ children }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} style={tdStyle}>
      {children}
    </td>
  );
}

const headerBox = { marginBottom: 24 };
const subtitle = { color: "#6b7280", marginTop: 8 };

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
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16
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

const tableBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  overflowX: "auto",
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

const searchInput = {
  width: "100%",
  padding: 12,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  marginBottom: 18
};

const agreementsList = {
  display: "flex",
  flexDirection: "column",
  gap: 18
};

const agreementCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 20,
  background: "#fff"
};

const agreementHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16
};

const muted = {
  color: "#6b7280",
  margin: "6px 0 0"
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 12,
  marginBottom: 16
};

const infoBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12
};

const infoLabel = {
  display: "block",
  color: "#6b7280",
  fontSize: 12,
  marginBottom: 6
};

const notesBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12
};

const thStyle = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e5e7eb"
};

const tdStyle = {
  padding: 12,
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "top"
};

const statusPill = {
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  height: "fit-content"
};

const smallStatus = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800
};

const actions = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
};

const cardActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18
};

const blueButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const greenButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const orangeButton = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const deleteButton = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const emptyBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 18,
  color: "#6b7280"
};

export default Agreements;