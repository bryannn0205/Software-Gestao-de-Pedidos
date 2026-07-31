import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth-context";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { EsqueciSenhaPage } from "./pages/EsqueciSenhaPage";
import { RedefinirSenhaPage } from "./pages/RedefinirSenhaPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClientesListPage } from "./pages/clientes/ClientesListPage";
import { ClienteFormPage } from "./pages/clientes/ClienteFormPage";
import { ProdutosListPage } from "./pages/produtos/ProdutosListPage";
import { ProdutoFormPage } from "./pages/produtos/ProdutoFormPage";
import { PedidosListPage } from "./pages/pedidos/PedidosListPage";
import { PedidoFormPage } from "./pages/pedidos/PedidoFormPage";
import { PedidoDetailPage } from "./pages/pedidos/PedidoDetailPage";
import { ProducaoPage } from "./pages/producao/ProducaoPage";
import { AdminPage } from "./pages/admin/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
            <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute modulo="dashboard">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="clientes"
                element={
                  <ProtectedRoute modulo="clientes">
                    <ClientesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/novo"
                element={
                  <ProtectedRoute modulo="clientes" acao="write">
                    <ClienteFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/:id"
                element={
                  <ProtectedRoute modulo="clientes" acao="write">
                    <ClienteFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="produtos"
                element={
                  <ProtectedRoute modulo="produtos">
                    <ProdutosListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="produtos/novo"
                element={
                  <ProtectedRoute modulo="produtos" acao="write">
                    <ProdutoFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="produtos/:id"
                element={
                  <ProtectedRoute modulo="produtos" acao="write">
                    <ProdutoFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="pedidos"
                element={
                  <ProtectedRoute modulo="pedidos">
                    <PedidosListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedidos/novo"
                element={
                  <ProtectedRoute modulo="pedidos" acao="write">
                    <PedidoFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedidos/:id/editar"
                element={
                  <ProtectedRoute modulo="pedidos" acao="write">
                    <PedidoFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedidos/:id"
                element={
                  <ProtectedRoute modulo="pedidos">
                    <PedidoDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="producao"
                element={
                  <ProtectedRoute modulo="producao">
                    <ProducaoPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="admin"
                element={
                  <ProtectedRoute modulo="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
