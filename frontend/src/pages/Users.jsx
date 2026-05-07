import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "OPERADOR",
  active: true
};

function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadUsers() {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar usuários.");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "OPERADOR",
      active: user.active
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
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active
        };

        if (form.password) {
          payload.password = form.password;
        }

        await api.put(`/users/${editingId}`, payload);

        alert("Usuário atualizado com sucesso!");
      } else {
        await api.post("/users", form);

        alert("Usuário criado com sucesso!");
      }

      closeForm();
      loadUsers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao salvar usuário.");
    }
  }

  async function toggleActive(id) {
    try {
      await api.patch(`/users/${id}/toggle-active`);
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar status do usuário.");
    }
  }

  async function deleteUser(id, name) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o usuário "${name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);

      alert("Usuário excluído com sucesso!");
      loadUsers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao excluir usuário.");
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Usuários</h1>
          <p style={subtitle}>
            Cadastre, edite e controle o acesso dos usuários do sistema.
          </p>
        </div>

        <button onClick={showForm ? closeForm : startCreate} className="btn-primary">
          {showForm ? "Fechar cadastro" : "Novo Usuário"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formBox}>
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Editar Usuário" : "Cadastrar Usuário"}
          </h2>

          <div style={grid}>
            <Input
              label="Nome"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label="E-mail"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
            />

            <Input
              label={editingId ? "Nova senha (opcional)" : "Senha"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!editingId}
              type="password"
            />

            <label style={labelStyle}>
              Perfil
              <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                <option value="ADMIN">Administrador</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="OPERADOR">Operador</option>
              </select>
            </label>

            <label style={checkLabel}>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Usuário ativo
            </label>
          </div>

          <div style={actions}>
            <button type="submit" className="btn-primary">
              {editingId ? "Salvar Alterações" : "Salvar Usuário"}
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
          <h2 style={{ margin: 0 }}>Lista de Usuários</h2>
          <span style={countBadge}>{users.length} usuário(s)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Perfil</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>
                  <span
                    style={{
                      ...statusPill,
                      background: user.active ? "#dcfce7" : "#fee2e2",
                      color: user.active ? "#166534" : "#991b1b"
                    }}
                  >
                    {user.active ? "ATIVO" : "INATIVO"}
                  </span>
                </Td>
                <Td>
                  <div style={actions}>
                    <button onClick={() => startEdit(user)} style={editButton}>
                      Editar
                    </button>

                    <button
                      onClick={() => toggleActive(user.id)}
                      style={user.active ? warningButton : successButton}
                    >
                      {user.active ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      style={deleteButton}
                    >
                      Excluir
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <Td colSpan="5">Nenhum usuário cadastrado.</Td>
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

const checkLabel = {
  fontWeight: 700,
  color: "#374151",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 28
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
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
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

const successButton = {
  background: "#16a34a",
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

const cancelButton = {
  background: "#6b7280",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

export default Users;