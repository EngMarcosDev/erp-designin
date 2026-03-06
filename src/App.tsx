import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import OrdersPage from "@/pages/OrdersPage";
import ProductsPage from "@/pages/ProductsPage";
import UsersPage from "@/pages/UsersPage";
import StockPage from "@/pages/StockPage";
import ReportsPage from "@/pages/ReportsPage";
import LoginPage from "@/pages/LoginPage";
import { ERPProvider } from "@/contexts/ERPContext";
import { MainLayout } from "@/components/layout/MainLayout";
import SettingsPage from "@/pages/SettingsPage";
import { UISettingsProvider } from "@/contexts/UISettingsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/types/erp";

const routeOrder: Array<{ path: string; permission: Permission }> = [
  { path: "/pedidos", permission: "gerenciar_pedidos" },
  { path: "/produtos", permission: "gerenciar_produtos" },
  { path: "/usuarios", permission: "gerenciar_usuarios" },
  { path: "/estoque", permission: "gerenciar_estoque" },
  { path: "/relatorios", permission: "ver_relatorios" },
  { path: "/configuracoes", permission: "gerenciar_usuarios" },
];

const resolveDefaultPath = (
  user: ReturnType<typeof useAuth>["user"],
  hasPermission: (permission: Permission) => boolean,
) => {
  if (!user || !user.active) return "/login";
  const firstAllowed = routeOrder.find((entry) => hasPermission(entry.permission));
  return firstAllowed?.path || "/login";
};

const PrivateRoute = ({
  children,
  requiredPermission,
}: {
  children: JSX.Element;
  requiredPermission?: Permission;
}) => {
  const { user, hasPermission } = useAuth();
  if (!user || !user.active) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={resolveDefaultPath(user, hasPermission)} replace />;
  }

  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, hasPermission } = useAuth();
  if (user?.active) {
    const defaultPath = resolveDefaultPath(user, hasPermission);
    if (defaultPath !== "/login") {
      return <Navigate to={defaultPath} replace />;
    }
  }
  return children;
};

const HomeRedirect = () => {
  const { user, hasPermission } = useAuth();
  return <Navigate to={resolveDefaultPath(user, hasPermission)} replace />;
};

const App = () => (
  <AuthProvider>
    <UISettingsProvider>
      <ERPProvider>
        <Toaster richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/pedidos"
              element={
                <PrivateRoute requiredPermission="gerenciar_pedidos">
                  <MainLayout>
                    <OrdersPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/produtos"
              element={
                <PrivateRoute requiredPermission="gerenciar_produtos">
                  <MainLayout>
                    <ProductsPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <PrivateRoute requiredPermission="gerenciar_usuarios">
                  <MainLayout>
                    <UsersPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/estoque"
              element={
                <PrivateRoute requiredPermission="gerenciar_estoque">
                  <MainLayout>
                    <StockPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/relatorios"
              element={
                <PrivateRoute requiredPermission="ver_relatorios">
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/configuracoes"
              element={
                <PrivateRoute requiredPermission="gerenciar_usuarios">
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </ERPProvider>
    </UISettingsProvider>
  </AuthProvider>
);

export default App;
