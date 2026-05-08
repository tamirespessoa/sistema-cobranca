const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");

// =========================
// ROTAS
// =========================
const authRoutes = require("./src/routes/auth.routes");
const protectedRoutes = require("./src/routes/protected.routes");
const debtorRoutes = require("./src/routes/debtor.routes");
const debtRoutes = require("./src/routes/debt.routes");
const paymentRoutes = require("./src/routes/payment.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const pixRoutes = require("./src/routes/pix.routes");
const negativeRoutes = require("./src/routes/negative.routes");
const userRoutes = require("./src/routes/user.routes");
const reportRoutes = require("./src/routes/report.routes");
const chargeRoutes = require("./src/routes/charge.routes");
const aiRoutes = require("./src/routes/ai.routes");
const reminderHistoryRoutes = require("./src/routes/reminderHistory.routes");
const emailRoutes = require("./src/routes/email.routes");
const automationSettingRoutes = require("./src/routes/automationSetting.routes");
const agreementRoutes = require("./src/routes/agreement.routes");

// =========================
// SERVIÇOS
// =========================
const {
  processAutomaticReminders
} = require("./src/services/automaticReminder.service");

dotenv.config();

const app = express();

// =========================
// CORS
// =========================
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://sistema-cobranca-psi.vercel.app"
  ],
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],
  credentials: true
}));

// =========================
// MIDDLEWARES
// =========================
app.use(express.json());

app.use("/uploads", express.static("uploads"));

// =========================
// ROTA PRINCIPAL
// =========================
app.get("/", (req, res) => {
  return res.json({
    message: "🚀 API Sistema de Cobrança funcionando!",
    status: "online"
  });
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  return res.json({
    message: "Servidor online",
    timestamp: new Date()
  });
});

// =========================
// ROTAS
// =========================
app.use("/auth", authRoutes);

app.use("/protected", protectedRoutes);

app.use("/debtors", debtorRoutes);

app.use("/debts", debtRoutes);

app.use("/payments", paymentRoutes);

app.use("/dashboard", dashboardRoutes);

app.use("/pix", pixRoutes);

app.use("/negative", negativeRoutes);

app.use("/users", userRoutes);

app.use("/reports", reportRoutes);

app.use("/charges", chargeRoutes);

app.use("/ai", aiRoutes);

app.use("/reminder-history", reminderHistoryRoutes);

app.use("/email", emailRoutes);

app.use("/automation-settings", automationSettingRoutes);

app.use("/agreements", agreementRoutes);

// =========================
// CRON AUTOMÁTICO
// =========================
cron.schedule("0 8 * * *", async () => {
  console.log("🚀 Executando lembretes automáticos");

  try {
    await processAutomaticReminders();

    console.log("✅ Lembretes automáticos executados");
  } catch (error) {
    console.error(
      "❌ Erro ao executar lembretes automáticos:",
      error
    );
  }
});

// =========================
// START SERVIDOR
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});