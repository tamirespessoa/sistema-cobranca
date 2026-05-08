import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = user.role === "ADMIN";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <div style={layout}>
      <aside style={sidebar}>
        <div>
          <div style={brandBox}>
            <div style={brandIcon}>
              R$
            </div>

            <div>
              <h2 style={brandTitle}>
                Cobrança Digital
              </h2>

              <p style={brandSubtitle}>
                Sistema Financeiro Inteligente
              </p>
            </div>
          </div>

          <nav style={nav}>
            <MenuItem
              active={isActive("/dashboard")}
              to="/dashboard"
              label="Dashboard"
            />

            <MenuItem
              active={isActive("/cobrancas")}
              to="/cobrancas"
              label="Cobranças"
            />

            <MenuItem
              active={isActive("/acordos")}
              to="/acordos"
              label="Acordos"
            />

            <MenuItem
              active={isActive("/devedores")}
              to="/devedores"
              label="Devedores"
            />

            <MenuItem
              active={isActive("/dividas")}
              to="/dividas"
              label="Dívidas"
            />

            <MenuItem
              active={isActive("/pagamentos")}
              to="/pagamentos"
              label="Pagamentos"
            />

            <MenuItem
              active={isActive("/pix")}
              to="/pix"
              label="Pix"
            />

            <MenuItem
              active={isActive("/whatsapp")}
              to="/whatsapp"
              label="WhatsApp"
            />

            <MenuItem
              active={isActive("/lembretes")}
              to="/lembretes"
              label="Lembretes IA"
            />

            <MenuItem
              active={isActive("/historico-cobrancas")}
              to="/historico-cobrancas"
              label="Histórico"
            />

            <MenuItem
              active={isActive("/negativacao")}
              to="/negativacao"
              label="Negativação"
            />

            <MenuItem
              active={isActive("/relatorios")}
              to="/relatorios"
              label="Relatórios"
            />

            {isAdmin && (
              <>
                <MenuItem
                  active={isActive("/usuarios")}
                  to="/usuarios"
                  label="Usuários"
                />

                <MenuItem
                  active={isActive("/configuracoes-automacao")}
                  to="/configuracoes-automacao"
                  label="Automação"
                />
              </>
            )}
          </nav>
        </div>

        <div style={sidebarFooter}>
          <div style={userBox}>
            <div style={userAvatar}>
              {user?.name?.charAt(0) || "U"}
            </div>

            <div>
              <strong style={userName}>
                {user?.name || "Usuário"}
              </strong>

              <p style={userRole}>
                {user?.role || "OPERADOR"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            style={logoutButton}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={main}>
        <div style={content}>
          {children}
        </div>
      </main>
    </div>
  );
}

function MenuItem({
  to,
  label,
  active
}) {
  return (
    <Link
      to={to}
      style={{
        ...menuItem,
        background: active
          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
          : "transparent",
        color: active
          ? "#fff"
          : "#d1d5db"
      }}
    >
      {label}
    </Link>
  );
}

const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#f3f4f6"
};

const sidebar = {
  width: 290,
  background: "#0f172a",
  color: "#fff",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  height: "100vh"
};

const brandBox = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 34
};

const brandIcon = {
  width: 54,
  height: 54,
  borderRadius: 16,
  background:
    "linear-gradient(135deg, #2563eb, #38bdf8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 20,
  boxShadow: "0 10px 20px rgba(37,99,235,0.35)"
};

const brandTitle = {
  margin: 0,
  fontSize: 21,
  fontWeight: 800
};

const brandSubtitle = {
  margin: "4px 0 0",
  color: "#94a3b8",
  fontSize: 13
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const menuItem = {
  textDecoration: "none",
  padding: "14px 16px",
  borderRadius: 14,
  fontWeight: 700,
  transition: "0.2s",
  fontSize: 15
};

const sidebarFooter = {
  marginTop: 28,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  paddingTop: 18
};

const userBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 18
};

const userAvatar = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 18
};

const userName = {
  fontSize: 14
};

const userRole = {
  margin: "4px 0 0",
  color: "#94a3b8",
  fontSize: 12
};

const logoutButton = {
  width: "100%",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "13px 16px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 15
};

const main = {
  flex: 1,
  overflow: "auto"
};

const content = {
  padding: 32
};

export default MainLayout;