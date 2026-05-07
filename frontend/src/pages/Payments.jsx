import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    debtId: "",
    amount: "",
    paymentMethod: "PIX",
    transactionCode: "",
    notes: ""
  });

  async function loadPayments() {
    try {
      const response = await api.get("/payments");
      setPayments(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar pagamentos.");
    }
  }

  async function loadDebts() {
    try {
      const response = await api.get("/debts");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dívidas.");
    }
  }

  useEffect(() => {
    loadPayments();
    loadDebts();
  }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/payments", {
        ...form,
        amount: Number(form.amount)
      });

      alert("Pagamento registrado com sucesso!");

      setForm({
        debtId: "",
        amount: "",
        paymentMethod: "PIX",
        transactionCode: "",
        notes: ""
      });

      setShowForm(false);
      loadPayments();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao registrar pagamento.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Pagamentos</h1>
          <p style={subtitle}>
            Registre pagamentos, acompanhe baixas automáticas e abra recibos em PDF.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? "Fechar registro" : "Registrar Pagamento"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formBox}>
          <h2 style={{ marginTop: 0 }}>Registrar Pagamento</h2>

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

                {debts
                  .filter((debt) => debt.status !== "QUITADA" && debt.status !== "CANCELADA")
                  .map((debt) => (
                    <option key={debt.id} value={debt.id}>
                      {debt.debtor?.fullName} - {debt.description} - {formatCurrency(debt.currentAmount)}
                    </option>
                  ))}
              </select>
            </label>

            <Input
              label="Valor pago"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              type="number"
            />

            <label style={labelStyle}>
              Forma de pagamento
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="PIX">Pix</option>
                <option value="BOLETO">Boleto</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de crédito</option>
                <option value="CARTAO_DEBITO">Cartão de débito</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>

            <Input
              label="Código da transação"
              name="transactionCode"
              value={form.transactionCode}
              onChange={handleChange}
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
            Salvar Pagamento
          </button>
        </form>
      )}

      <div style={tableBox}>
        <div style={tableHeader}>
          <h2 style={{ margin: 0 }}>Histórico de Pagamentos</h2>
          <span style={countBadge}>{payments.length} registrado(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Devedor</Th>
              <Th>Dívida</Th>
              <Th>Valor Pago</Th>
              <Th>Forma</Th>
              <Th>Data</Th>
              <Th>Recibo</Th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <Td>{payment.debt?.debtor?.fullName || "Não informado"}</Td>
                <Td>{payment.debt?.description || "Não informado"}</Td>
                <Td>{formatCurrency(payment.amount)}</Td>
                <Td>
                  <span style={methodPill}>
                    {payment.paymentMethod}
                  </span>
                </Td>
                <Td>{new Date(payment.paymentDate).toLocaleDateString("pt-BR")}</Td>
                <Td>
                  {payment.receipt?.fileUrl ? (
                    <a
                      href={`http://localhost:3001${payment.receipt.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={receiptLink}
                    >
                      Abrir recibo
                    </a>
                  ) : (
                    <span style={noReceipt}>Sem recibo</span>
                  )}
                </Td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <Td colSpan="6">Nenhum pagamento registrado.</Td>
              </tr>
            )}
          </tbody>
        </table>
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

const methodPill = {
  display: "inline-block",
  background: "#dcfce7",
  color: "#166534",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800
};

const receiptLink = {
  display: "inline-block",
  background: "#2563eb",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700
};

const noReceipt = {
  color: "#9ca3af",
  fontWeight: 700
};

export default Payments;