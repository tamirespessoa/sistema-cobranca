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

// =========================
// SERVIÇOS
// =========================
const {
  processAutomaticReminders
} = require("./src/services/automaticReminder.service");

dotenv.config();

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
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
// ROTAS DA API
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

// =========================
// AGENDADOR AUTOMÁTICO
// TODOS OS DIAS ÀS 08:00
// =========================
cron.schedule("0 8 * * *", async () => {
  console.log("🚀 Executando lembretes automáticos");

  await processAutomaticReminders();
});

// =========================
// START SERVIDOR
// =========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});