import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Charges from "./pages/Charges";
import Debtors from "./pages/Debtors";
import Debts from "./pages/Debts";
import Payments from "./pages/Payments";
import PixCharges from "./pages/PixCharges";
import WhatsappCharges from "./pages/WhatsappCharges";
import Negative from "./pages/Negative";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Reminders from "./pages/Reminders";
import ReminderHistory from "./pages/ReminderHistory";
import AutomationSettings from "./pages/AutomationSettings";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getUser();

  if (!token) {
    return <Navigate to="/" />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/cobrancas"
          element={
            <PrivateRoute>
              <Charges />
            </PrivateRoute>
          }
        />

        <Route
          path="/devedores"
          element={
            <PrivateRoute>
              <Debtors />
            </PrivateRoute>
          }
        />

        <Route
          path="/dividas"
          element={
            <PrivateRoute>
              <Debts />
            </PrivateRoute>
          }
        />

        <Route
          path="/pagamentos"
          element={
            <PrivateRoute>
              <Payments />
            </PrivateRoute>
          }
        />

        <Route
          path="/pix"
          element={
            <PrivateRoute>
              <PixCharges />
            </PrivateRoute>
          }
        />

        <Route
          path="/whatsapp"
          element={
            <PrivateRoute>
              <WhatsappCharges />
            </PrivateRoute>
          }
        />

        <Route
          path="/lembretes"
          element={
            <PrivateRoute>
              <Reminders />
            </PrivateRoute>
          }
        />

        <Route
          path="/historico-cobrancas"
          element={
            <PrivateRoute>
              <ReminderHistory />
            </PrivateRoute>
          }
        />

        <Route
          path="/negativacao"
          element={
            <PrivateRoute>
              <Negative />
            </PrivateRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />

        <Route
          path="/configuracoes-automacao"
          element={
            <AdminRoute>
              <AutomationSettings />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;