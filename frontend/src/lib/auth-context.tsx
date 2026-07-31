import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Acao, Modulo, Usuario } from "./types";

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  carregandoGoogle: boolean;
  login: (email: string, senha: string, lembrarMe?: boolean) => Promise<void>;
  loginComGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  temPermissao: (modulo: Modulo, acao: Acao) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function lerUsuarioArmazenado(): Usuario | null {
  const raw = localStorage.getItem("usuario");
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(lerUsuarioArmazenado);
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  async function login(email: string, senha: string, lembrarMe = false) {
    setCarregando(true);
    try {
      const { data } = await api.post("/auth/login", { email, senha, lembrarMe });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    } finally {
      setCarregando(false);
    }
  }

  async function loginComGoogle(credential: string) {
    setCarregandoGoogle(true);
    try {
      const { data } = await api.post("/auth/google", { credential });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    } finally {
      setCarregandoGoogle(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  function temPermissao(modulo: Modulo, acao: Acao) {
    return usuario?.permissoes[modulo]?.includes(acao) ?? false;
  }

  const value = useMemo(
    () => ({ usuario, carregando, carregandoGoogle, login, loginComGoogle, logout, temPermissao }),
    [usuario, carregando, carregandoGoogle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
