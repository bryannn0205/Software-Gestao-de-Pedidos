import { useState } from "react";
import clsx from "clsx";
import { PageHeader } from "../../components/ui";
import { DominiosTab } from "./DominiosTab";
import { ParametrosTab } from "./ParametrosTab";
import { UsuariosTab } from "./UsuariosTab";
import { AuditoriaTab } from "./AuditoriaTab";

const ABAS = [
  { id: "dominios", label: "Tabelas de Domínio" },
  { id: "parametros", label: "Parâmetros" },
  { id: "usuarios", label: "Usuários e Perfis" },
  { id: "auditoria", label: "Auditoria" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export function AdminPage() {
  const [aba, setAba] = useState<AbaId>("dominios");

  return (
    <div>
      <PageHeader title="Configurações" />
      <div className="mb-6 flex gap-2 border-b border-border-subtle">
        {ABAS.map((item) => (
          <button
            key={item.id}
            onClick={() => setAba(item.id)}
            className={clsx(
              "px-4 py-2 text-sm font-medium",
              aba === item.id ? "border-b-2 border-brand-500 text-brand-500" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {aba === "dominios" && <DominiosTab />}
      {aba === "parametros" && <ParametrosTab />}
      {aba === "usuarios" && <UsuariosTab />}
      {aba === "auditoria" && <AuditoriaTab />}
    </div>
  );
}
