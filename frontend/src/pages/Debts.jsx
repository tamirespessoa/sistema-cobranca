import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

const emptyForm = {
  debtorId: "",
  description: "",
  originalAmount: "",
  currentAmount: "",
  dueDate: "",
  paymentMethod: "PIX",
  status: "ABERTA",
  installmentNumber: "",
  totalInstallments: "",
  notes: ""
};

function Debts() {
  const [debts, setDebts] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadDebts() {
    try {
      const response = await api.get("/debts");
      setDebts(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dívidas.");
    }
  }

  async function loadDebtors() {
    try {
      const response = await api.get("/debtors");
      setDebtors(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar devedores.");
    }
  }

  useEffect(() => {
    loadDebts();
    loadDebtors();
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

  function formatDateInput(date) {
    if (!date) return "";

    return new Date(date).toISOString().split("T")[0];
  }

  function getStatusStyle(status) {
    if (status === "QUITADA") {
      return {
        background: "#dcfce7",
        color: "#166534"
      };
    }

    if (status === "VENCIDA" || status === "NEGATIVADA") {
      return {
        background: "#fee2e2",
        color: "#991b1b"
      };
    }

    if (status === "PARCIALMENTE_PAGA") {
      return {
        background: "#fef3c7",
        color: "#92400e"
      };
    }

    return {
      background: "#dbeafe",
      color: "#1d4ed8"
    };
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(debt) {
    setEditingId(debt.id);

    setForm({
      debtorId: debt.debtorId || "",
      description: debt.description || "",
      originalAmount: debt.originalAmount || "",
      currentAmount: debt.currentAmount || "",
      dueDate: formatDateInput(debt.dueDate),
      paymentMethod: debt.paymentMethod || "PIX",
      status: debt.status || "ABERTA",
      installmentNumber: debt.installmentNumber || "",
      totalInstallments: debt.totalInstallments || "",
      notes: debt.notes || ""
    });

    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      originalAmount: Number(form.originalAmount),
      currentAmount: Number(form.currentAmount || form.originalAmount),
      installmentNumber: form.installmentNumber ? Number(form.installmentNumber) : null,
      totalInstallments: form.totalInstallments ? Number(form.totalInstallments) : null
    };

    try {
      if (editingId) {
        await api.put(`/debts/${editingId}`, payload);
        alert("Dívida atualizada com sucesso!");
      } else {
        await api.post("/debts", payload);
        alert("Dívida cadastrada com sucesso!");
      }

      closeForm();
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao salvar dívida.");
    }
  }

  async function deleteDebt(id, description) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a dívida "${description}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/debts/${id}`);

      alert("Dívida excluída com sucesso!");
      loadDebts();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao excluir dívida.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Dívidas</h1>
          <p style={subtitle}>
            Cadastre, edite e controle vencimentos, valores, status e formas de pagamento.
          </p>
        </div>

        <button
          onClick={showForm ? closeForm : startCreate}
          className="btn-primary"
        >
          {showForm ? "Fechar cadastro" : "Nova Dívida"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formBox}>
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Editar Dívida" : "Cadastrar Dívida"}
          </h2>

          <div style={grid}>
            <label style={labelStyle}>
              Devedor
              <select
                name="debtorId"
                value={form.debtorId}
                onChange={handleChange}
                required
                style={inputStyle}
                disabled={!!editingId}
              >
                <option value="">Selecione um devedor</option>

                {debtors.map((debtor) => (
                  <option key={debtor.id} value={debtor.id}>
                    {debtor.fullName} - {debtor.cpf}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Descrição"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />

            <Input
              label="Valor original"
              name="originalAmount"
              value={form.originalAmount}
              onChange={handleChange}
              required
              type="number"
            />

            <Input
              label="Valor atual"
              name="currentAmount"
              value={form.currentAmount}
              onChange={handleChange}
              type="number"
            />

            <Input
              label="Data de vencimento"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              type="date"
              required
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

            {editingId && (
              <label style={labelStyle}>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="ABERTA">Aberta</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="PARCIALMENTE_PAGA">Parcialmente paga</option>
                  <option value="QUITADA">Quitada</option>
                  <option value="NEGATIVADA">Negativada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </label>
            )}

            <Input
              label="Nº da parcela"
              name="installmentNumber"
              value={form.installmentNumber}
              onChange={handleChange}
              type="number"
            />

            <Input
              label="Total de parcelas"
              name="totalInstallments"
              value={form.totalInstallments}
              onChange={handleChange}
              type="number"
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

          <div style={actions}>
            <button type="submit" className="btn-primary">
              {editingId ? "Salvar Alterações" : "Salvar Dívida"}
            </button>

            {editingId && (
              <button type="button" onClick={closeForm} style={cancelButton}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      )}

      <div style={tableBox}>
        <div style={tableHeader}>
          <h2 style={{ margin: 0 }}>Lista de Dívidas</h2>
          <span style={countBadge}>{debts.length} cadastrada(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Devedor</Th>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Forma</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {debts.map((debt) => (
              <tr key={debt.id}>
                <Td>{debt.debtor?.fullName || "Não informado"}</Td>
                <Td>{debt.description}</Td>
                <Td>{formatCurrency(debt.currentAmount)}</Td>
                <Td>{new Date(debt.dueDate).toLocaleDateString("pt-BR")}</Td>
                <Td>{debt.paymentMethod || "Não informado"}</Td>
                <Td>
                  <span
                    style={{
                      ...statusPill,
                      ...getStatusStyle(debt.status)
                    }}
                  >
                    {debt.status}
                  </span>
                </Td>
                <Td>
                  <div style={actions}>
                    <button
                      onClick={() => startEdit(debt)}
                      style={editButton}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteDebt(debt.id, debt.description)}
                      style={deleteButton}
                    >
                      Excluir
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {debts.length === 0 && (
              <tr>
                <Td colSpan="7">Nenhuma dívida cadastrada.</Td>
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

const statusPill = {
  display: "inline-block",
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

const editButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const deleteButton = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const cancelButton = {
  background: "#6b7280",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

export default Debts;