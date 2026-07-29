import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Paginado } from "../../lib/types";
import { formatarData } from "../../lib/format";
import { Card, Input } from "../../components/ui";

interface RegistroAuditoria {
  id: string;
  entidade: string;
  entidadeId: string;
  acao: string;
  em: string;
  usuario: { nome: string; email: string } | null;
}

const ACAO_LABEL: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  STATUS_CHANGE: "Mudança de status",
};

export function AuditoriaTab() {
  const [entidade, setEntidade] = useState("");

  const { data } = useQuery({
    queryKey: ["auditoria", entidade],
    queryFn: async () => {
      const { data } = await api.get<Paginado<RegistroAuditoria>>("/auditoria", {
        params: { entidade: entidade || undefined, pageSize: 50 },
      });
      return data;
    },
  });

  return (
    <div>
      <Card className="mb-4 p-4">
        <Input placeholder="Filtrar por entidade (Cliente, Produto, Pedido)..." value={entidade} onChange={(e) => setEntidade(e.target.value)} />
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Entidade</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-tertiary">Nenhum registro encontrado.</td>
              </tr>
            )}
            {data?.data.map((registro) => (
              <tr key={registro.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 text-text-secondary">{formatarData(registro.em)}</td>
                <td className="px-4 py-3">{registro.usuario?.nome ?? "-"}</td>
                <td className="px-4 py-3">{ACAO_LABEL[registro.acao] ?? registro.acao}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {registro.entidade} <span className="text-xs text-text-tertiary">#{registro.entidadeId.slice(0, 8)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
