import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

const emptyForm = {
  fullName: "",
  rg: "",
  cpf: "",
  phone: "",
  whatsapp: "",
  email: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  status: "ATIVO",
  notes: ""
};

function Debtors() {
  const [debtors, setDebtors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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
    loadDebtors();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(debtor) {
    setEditingId(debtor.id);
    setForm({
      fullName: debtor.fullName || "",
      rg: debtor.rg || "",
      cpf: debtor.cpf || "",
      phone: debtor.phone || "",
      whatsapp: debtor.whatsapp || "",
      email: debtor.email || "",
      street: debtor.street || "",
      number: debtor.number || "",
      complement: debtor.complement || "",
      neighborhood: debtor.neighborhood || "",
      city: debtor.city || "",
      state: debtor.state || "",
      zipCode: debtor.zipCode || "",
      status: debtor.status || "ATIVO",
      notes: debtor.notes || ""
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

    try {
      if (editingId) {
        await api.put(`/debtors/${editingId}`, form);
        alert("Devedor atualizado com sucesso!");
      } else {
        await api.post("/debtors", form);
        alert("Devedor cadastrado com sucesso!");
      }

      closeForm();
      loadDebtors();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao salvar devedor.");
    }
  }

  async function deleteDebtor(id, name) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o devedor "${name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/debtors/${id}`);
      alert("Devedor excluído com sucesso!");
      loadDebtors();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao excluir devedor.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Devedores</h1>
          <p style={subtitle}>
            Cadastre, edite e acompanhe pessoas com cobranças.
          </p>
        </div>

        <button onClick={showForm ? closeForm : startCreate} className="btn-primary">
          {showForm ? "Fechar cadastro" : "Novo Devedor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formBox}>
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Editar Devedor" : "Cadastrar Devedor"}
          </h2>

          <div style={grid}>
            <Input label="Nome completo" name="fullName" value={form.fullName} onChange={handleChange} required />
            <Input label="RG" name="rg" value={form.rg} onChange={handleChange} />
            <Input label="CPF" name="cpf" value={form.cpf} onChange={handleChange} required />
            <Input label="Telefone" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="WhatsApp" name="whatsapp" value={form.whatsapp} onChange={handleChange} />
            <Input label="E-mail" name="email" value={form.email} onChange={handleChange} />
            <Input label="Rua" name="street" value={form.street} onChange={handleChange} />
            <Input label="Número" name="number" value={form.number} onChange={handleChange} />
            <Input label="Complemento" name="complement" value={form.complement} onChange={handleChange} />
            <Input label="Bairro" name="neighborhood" value={form.neighborhood} onChange={handleChange} />
            <Input label="Cidade" name="city" value={form.city} onChange={handleChange} />
            <Input label="Estado" name="state" value={form.state} onChange={handleChange} />
            <Input label="CEP" name="zipCode" value={form.zipCode} onChange={handleChange} />

            <label style={labelStyle}>
              Status
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option value="ATIVO">Ativo</option>
                <option value="EM_NEGOCIACAO">Em negociação</option>
                <option value="QUITADO">Quitado</option>
                <option value="INADIMPLENTE">Inadimplente</option>
              </select>
            </label>
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
              {editingId ? "Salvar Alterações" : "Salvar Devedor"}
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
          <h2 style={{ margin: 0 }}>Lista de Devedores</h2>
          <span style={countBadge}>{debtors.length} cadastrado(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>CPF</Th>
              <Th>Telefone</Th>
              <Th>E-mail</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {debtors.map((debtor) => (
              <tr key={debtor.id}>
                <Td>{debtor.fullName}</Td>
                <Td>{debtor.cpf}</Td>
                <Td>{debtor.whatsapp || debtor.phone || "Não informado"}</Td>
                <Td>{debtor.email || "Não informado"}</Td>
                <Td>
                  <span className="status-pill">{debtor.status}</span>
                </Td>
                <Td>
                  <div style={actions}>
                    <button onClick={() => startEdit(debtor)} style={editButton}>
                      Editar
                    </button>

                    <button
                      onClick={() => deleteDebtor(debtor.id, debtor.fullName)}
                      style={deleteButton}
                    >
                      Excluir
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {debtors.length === 0 && (
              <tr>
                <Td colSpan="6">Nenhum devedor cadastrado.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function Input({ label, name, value, onChange, required }) {
  return (
    <label style={labelStyle}>
      {label}
      <input
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

export default Debtors;