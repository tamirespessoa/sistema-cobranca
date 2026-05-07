import { useEffect, useMemo, useState } from "react";

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
  debtorNotes: "",
  description: "",
  originalAmount: "",
  currentAmount: "",
  dueDate: "",
  paymentMethod: "PIX",
  installmentNumber: "",
  totalInstallments: "",
  debtNotes: ""
};

function Charges() {
  const [charges, setCharges] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [generatingPixId, setGeneratingPixId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  async function loadCharges() {
    try {
      const response = await api.get("/debts");
      setCharges(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar cobranças.");
    }
  }

  useEffect(() => {
    loadCharges();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function clearForm() {
    setForm(emptyForm);
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function onlyNumbers(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function createWhatsappMessage(charge) {
    return `Olá, ${charge.debtor?.fullName || "tudo bem"}!

Identificamos uma cobrança em aberto em seu nome.

Descrição: ${charge.description}
Valor: ${formatCurrency(charge.currentAmount)}
Vencimento: ${new Date(charge.dueDate).toLocaleDateString("pt-BR")}

Para regularizar, por favor entre em contato ou realize o pagamento conforme combinado.

Atenciosamente,
Sistema de Cobrança Digital`;
  }

  function sendWhatsapp(charge) {
    const phone = onlyNumbers(charge.debtor?.whatsapp || charge.debtor?.phone);

    if (!phone) {
      alert("Este devedor não possui telefone ou WhatsApp cadastrado.");
      return;
    }

    const message = encodeURIComponent(createWhatsappMessage(charge));
    const url = `https://wa.me/55${phone}?text=${message}`;

    window.open(url, "_blank");
  }

  const filteredCharges = useMemo(() => {
    return charges.filter((charge) => {
      const debtorName = charge.debtor?.fullName?.toLowerCase() || "";
      const cpf = charge.debtor?.cpf || "";
      const description = charge.description?.toLowerCase() || "";
      const phone = charge.debtor?.phone || "";
      const whatsapp = charge.debtor?.whatsapp || "";

      const searchText = search.toLowerCase();

      const matchesSearch =
        debtorName.includes(searchText) ||
        cpf.includes(search) ||
        description.includes(searchText) ||
        phone.includes(search) ||
        whatsapp.includes(search);

      const matchesStatus =
        statusFilter === "TODOS"
          ? true
          : charge.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [charges, search, statusFilter]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/charges", {
        debtor: {
          fullName: form.fullName,
          rg: form.rg,
          cpf: form.cpf,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          notes: form.debtorNotes,
          status: "ATIVO"
        },
        debt: {
          description: form.description,
          originalAmount: form.originalAmount,
          currentAmount: form.currentAmount,
          dueDate: form.dueDate,
          paymentMethod: form.paymentMethod,
          installmentNumber: form.installmentNumber,
          totalInstallments: form.totalInstallments,
          notes: form.debtNotes
        }
      });

      alert("Cobrança cadastrada com sucesso!");

      clearForm();
      loadCharges();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Erro ao cadastrar cobrança."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generatePix(chargeId) {
    try {
      setGeneratingPixId(chargeId);

      await api.post("/pix", {
        debtId: chargeId
      });

      alert("Pix gerado com sucesso! Acesse o menu Pix para ver o QR Code.");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Erro ao gerar Pix."
      );
    } finally {
      setGeneratingPixId(null);
    }
  }

  async function deleteCharge(id, description) {
    const confirmDelete = window.confirm(
      `Deseja excluir a cobrança "${description}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/debts/${id}`);

      alert("Cobrança excluída com sucesso!");

      loadCharges();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Erro ao excluir cobrança."
      );
    }
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

    if (status === "CANCELADA") {
      return {
        background: "#e5e7eb",
        color: "#374151"
      };
    }

    return {
      background: "#dbeafe",
      color: "#1d4ed8"
    };
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Cobranças</h1>

          <p style={subtitle}>
            Cadastre o devedor e a dívida juntos, acompanhe cobranças, gere Pix e envie WhatsApp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        <div style={sectionTitleBox}>
          <div>
            <h2 style={sectionTitle}>Dados do Devedor</h2>
            <p style={sectionSubtitle}>
              Informações pessoais, contato e endereço do devedor.
            </p>
          </div>
        </div>

        <div style={grid}>
          <Input
            label="Nome completo"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <Input
            label="CPF"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            required
          />

          <Input
            label="RG"
            name="rg"
            value={form.rg}
            onChange={handleChange}
          />

          <Input
            label="Telefone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            label="WhatsApp"
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
          />

          <Input
            label="E-mail"
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
          />

          <Input
            label="Rua"
            name="street"
            value={form.street}
            onChange={handleChange}
          />

          <Input
            label="Número"
            name="number"
            value={form.number}
            onChange={handleChange}
          />

          <Input
            label="Complemento"
            name="complement"
            value={form.complement}
            onChange={handleChange}
          />

          <Input
            label="Bairro"
            name="neighborhood"
            value={form.neighborhood}
            onChange={handleChange}
          />

          <Input
            label="Cidade"
            name="city"
            value={form.city}
            onChange={handleChange}
          />

          <Input
            label="Estado"
            name="state"
            value={form.state}
            onChange={handleChange}
          />

          <Input
            label="CEP"
            name="zipCode"
            value={form.zipCode}
            onChange={handleChange}
          />
        </div>

        <label style={labelStyle}>
          Observações do devedor
          <textarea
            name="debtorNotes"
            value={form.debtorNotes}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 80 }}
          />
        </label>

        <div style={divider}></div>

        <div style={sectionTitleBox}>
          <div>
            <h2 style={sectionTitle}>Dados da Dívida</h2>
            <p style={sectionSubtitle}>
              Informe valor, vencimento, forma de pagamento e parcelamento.
            </p>
          </div>
        </div>

        <div style={grid}>
          <Input
            label="Descrição da dívida"
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
            required
            type="date"
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
          Observações da dívida
          <textarea
            name="debtNotes"
            value={form.debtNotes}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 80 }}
          />
        </label>

        <div style={formActions}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Cobrança"}
          </button>

          <button type="button" onClick={clearForm} style={clearButton}>
            Limpar formulário
          </button>
        </div>
      </form>

      <div style={tableBox}>
        <div style={tableHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Cobranças cadastradas</h2>
            <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
              Busque por nome, CPF, telefone, WhatsApp ou descrição da dívida.
            </p>
          </div>

          <span style={countBadge}>
            {filteredCharges.length} cobrança(s)
          </span>
        </div>

        <div style={filters}>
          <input
            placeholder="Buscar por nome, CPF, telefone ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelect}
          >
            <option value="TODOS">Todos status</option>
            <option value="ABERTA">Aberta</option>
            <option value="VENCIDA">Vencida</option>
            <option value="PARCIALMENTE_PAGA">Parcialmente paga</option>
            <option value="QUITADA">Quitada</option>
            <option value="NEGATIVADA">Negativada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Devedor</Th>
              <Th>CPF</Th>
              <Th>Contato</Th>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Vencimento</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {filteredCharges.map((charge) => (
              <tr key={charge.id}>
                <Td>{charge.debtor?.fullName || "Não informado"}</Td>

                <Td>{charge.debtor?.cpf || "Não informado"}</Td>

                <Td>
                  {charge.debtor?.whatsapp ||
                    charge.debtor?.phone ||
                    "Não informado"}
                </Td>

                <Td>{charge.description}</Td>

                <Td>{formatCurrency(charge.currentAmount)}</Td>

                <Td>
                  {new Date(charge.dueDate).toLocaleDateString("pt-BR")}
                </Td>

                <Td>
                  <span
                    style={{
                      ...statusPill,
                      ...getStatusStyle(charge.status)
                    }}
                  >
                    {charge.status}
                  </span>
                </Td>

                <Td>
                  <div style={actions}>
                    <button
                      onClick={() => generatePix(charge.id)}
                      style={{
                        ...pixButton,
                        opacity:
                          charge.status === "QUITADA" ||
                          charge.status === "CANCELADA"
                            ? 0.5
                            : 1
                      }}
                      disabled={
                        charge.status === "QUITADA" ||
                        charge.status === "CANCELADA" ||
                        generatingPixId === charge.id
                      }
                    >
                      {generatingPixId === charge.id
                        ? "Gerando..."
                        : "Gerar Pix"}
                    </button>

                    <button
                      onClick={() => sendWhatsapp(charge)}
                      style={whatsappButton}
                    >
                      WhatsApp
                    </button>

                    <button
                      onClick={() =>
                        deleteCharge(charge.id, charge.description)
                      }
                      style={deleteButton}
                    >
                      Excluir
                    </button>
                  </div>
                </Td>
              </tr>
            ))}

            {filteredCharges.length === 0 && (
              <tr>
                <Td colSpan="8">
                  Nenhuma cobrança encontrada.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  required,
  type = "text"
}) {
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

const sectionTitleBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16
};

const sectionTitle = {
  margin: 0
};

const sectionSubtitle = {
  color: "#6b7280",
  margin: "6px 0 0"
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

const divider = {
  height: 1,
  background: "#e5e7eb",
  margin: "22px 0"
};

const formActions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const clearButton = {
  background: "#6b7280",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
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

const filters = {
  display: "flex",
  gap: 16,
  marginBottom: 20
};

const searchInput = {
  flex: 1,
  padding: 12,
  border: "1px solid #d1d5db",
  borderRadius: 10
};

const filterSelect = {
  width: 240,
  padding: 12,
  border: "1px solid #d1d5db",
  borderRadius: 10
};

const thStyle = {
  textAlign: "left",
  padding: 14,
  borderBottom: "1px solid #e5e7eb"
};

const tdStyle = {
  padding: 14,
  borderBottom: "1px solid #f3f4f6"
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

const pixButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

const whatsappButton = {
  background: "#22c55e",
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

export default Charges;
