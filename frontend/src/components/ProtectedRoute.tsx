import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import type { Acao, Modulo } from "../lib/types";

export function ProtectedRoute({
  children,
  modulo,
  acao = "read",
}: {
  children: React.ReactNode;
  modulo?: Modulo;
  acao?: Acao;
}) {
  const { usuario, temPermissao } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (modulo && !temPermissao(modulo, acao)) {
    return (
      <div className="p-8 text-center text-slate-500">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return <>{children}</>;
}
