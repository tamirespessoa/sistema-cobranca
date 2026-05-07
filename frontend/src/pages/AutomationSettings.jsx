import { useEffect, useState } from "react";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function AutomationSettings() {
  const [form, setForm] = useState({
    automaticReminders: true,
    automaticEmail: false,
    runHour: 8,
    runMinute: 0
  });

  const [running, setRunning] = useState(false);

  async function loadSettings() {
    try {
      const response = await api.get("/automation-settings");

      setForm({
        automaticReminders: response.data.automaticReminders,
        automaticEmail: response.data.automaticEmail,
        runHour: response.data.runHour,
        runMinute: response.data.runMinute
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar configurações.");
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.put("/automation-settings", form);

      alert("Configurações salvas com sucesso!");
      loadSettings();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao salvar configurações.");
    }
  }

  async function runNow() {
    const confirmRun = window.confirm(
      "Deseja executar a automação agora? Se o envio de e-mail automático estiver ligado, o sistema poderá enviar e-mails reais."
    );

    if (!confirmRun) {
      return;
    }

    try {
      setRunning(true);

      await api.post("/automation-settings/run-now");

      alert("Automação executada com sucesso! Confira o Histórico.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Erro ao executar automação.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <MainLayout>
      <div style={headerBox}>
        <div>
          <h1 className="page-title">Configurações da Automação</h1>
          <p style={subtitle}>
            Controle se o sistema pode gerar lembretes e enviar e-mails automaticamente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={formBox}>
        <label style={checkLabel}>
          <input
            type="checkbox"
            name="automaticReminders"
            checked={form.automaticReminders}
            onChange={handleChange}
          />
          Ativar lembretes automáticos
        </label>

        <label style={checkLabel}>
          <input
            type="checkbox"
            name="automaticEmail"
            checked={form.automaticEmail}
            onChange={handleChange}
          />
          Enviar e-mail automático real
        </label>

        <div style={grid}>
          <label style={labelStyle}>
            Hora da execução
            <input
              type="number"
              name="runHour"
              min="0"
              max="23"
              value={form.runHour}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Minuto da execução
            <input
              type="number"
              name="runMinute"
              min="0"
              max="59"
              value={form.runMinute}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={warningBox}>
          <strong>Atenção:</strong> enquanto estiver testando, deixe o envio automático de e-mail desligado.
          Ative apenas quando tiver certeza de que o SMTP está configurado corretamente.
        </div>

        <div style={actions}>
          <button type="submit" className="btn-primary">
            Salvar Configurações
          </button>

          <button
            type="button"
            onClick={runNow}
            style={runButton}
            disabled={running}
          >
            {running ? "Executando..." : "Executar automação agora"}
          </button>
        </div>
      </form>
    </MainLayout>
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
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb"
};

const checkLabel = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 700,
  marginBottom: 18,
  color: "#374151"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16,
  marginTop: 10
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

const warningBox = {
  background: "#fff7ed",
  color: "#9a3412",
  border: "1px solid #fed7aa",
  padding: 16,
  borderRadius: 14,
  margin: "10px 0 20px",
  lineHeight: 1.5
};

const actions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap"
};

const runButton = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700
};

export default AutomationSettings;