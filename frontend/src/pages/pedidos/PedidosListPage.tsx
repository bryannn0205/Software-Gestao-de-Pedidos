import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Pedido, Paginado } from "../../lib/types";
import { formatarData, formatarMoeda, ETAPA_LABEL } from "../../lib/format";
import { Badge, Button, Card, Input, PageHeader, Select } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

const ETAPA_COR: Record<string, "yellow" | "blue" | "green"> = {
  EM_PRODUCAO: "yellow",
  FINALIZADO: "blue",
  ENTREGUE: "green",
};

export function PedidosListPage() {
  const [etapa, setEtapa] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const numeroDebounced = useDebouncedValue(numero);
  const cidadeDebounced = useDebouncedValue(cidade);
  const [page, setPage] = useState(1);
  const { temPermissao } = useAuth();
  const podeEditar = temPermissao("pedidos", "write");

  const { data, isLoading } = useQuery({
    queryKey: ["pedidos", etapa, numeroDebounced, cidadeDebounced, page],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Pedido>>("/pedidos", {
        params: {
          etapa: etapa || undefined,
          numero: numeroDebounced || undefined,
          cidade: cidadeDebounced || undefined,
          page,
          pageSize: 20,
        },
      });
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Pedidos"
        actions={
          podeEditar && (
            <Link to="/pedidos/novo">
              <Button>Novo pedido</Button>
            </Link>
          )
        }
      />

      <Card className="mb-4 grid grid-cols-4 gap-3 p-4">
        <Select value={etapa} onChange={(e) => { setEtapa(e.target.value); setPage(1); }}>
          <option value="">Todas as etapas</option>
          <option value="EM_PRODUCAO">Em Produção</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="ENTREGUE">Entregue (OK)</option>
        </Select>
        <Input placeholder="Nº do pedido" value={numero} onChange={(e) => { setNumero(e.target.value); setPage(1); }} />
        <Input placeholder="Cidade" value={cidade} onChange={(e) => { setCidade(e.target.value); setPage(1); }} />
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Data Pedido</th>
              <th className="px-4 py-3">Entrega Prevista</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-tertiary">Carregando...</td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-tertiary">Nenhum pedido encontrado.</td>
              </tr>
            )}
            {data?.data.map((pedido) => (
              <tr key={pedido.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 font-medium text-text-primary">#{pedido.numero}</td>
                <td className="px-4 py-3 text-text-secondary">{formatarData(pedido.dataPedido)}</td>
                <td className="px-4 py-3 text-text-secondary">{formatarData(pedido.dataEntregaPrevista)}</td>
                <td className="px-4 py-3 text-text-secondary">{pedido.cliente.razaoSocial}</td>
                <td className="px-4 py-3">
                  <Badge color={ETAPA_COR[pedido.etapa]}>{ETAPA_LABEL[pedido.etapa]}</Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatarMoeda(pedido.valorComDesconto)}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/pedidos/${pedido.id}`} className="text-sm text-brand-400 hover:text-brand-300 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data && data.total > data.pageSize && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="px-3 py-2 text-sm text-text-secondary">
            Página {page} de {Math.ceil(data.total / data.pageSize)}
          </span>
          <Button
            variant="secondary"
            disabled={page >= Math.ceil(data.total / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
