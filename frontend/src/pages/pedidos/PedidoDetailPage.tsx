import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Pedido } from "../../lib/types";
import { ETAPA_LABEL, SITUACAO_PRAZO_LABEL, formatarData, formatarMoeda } from "../../lib/format";
import { Badge, Button, Card, PageHeader } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";

export function PedidoDetailPage() {
  const { id } = useParams();
  const { temPermissao } = useAuth();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data } = await api.get<Pedido>(`/pedidos/${id}`);
      return data;
    },
  });

  if (isLoading || !pedido) return <p className="text-text-tertiary">Carregando...</p>;

  return (
    <div>
      <PageHeader
        title={`Pedido #${pedido.numero}`}
        actions={
          pedido.etapa === "EM_PRODUCAO" &&
          temPermissao("pedidos", "write") && (
            <Link to={`/pedidos/${pedido.id}/editar`}>
              <Button variant="secondary">Editar</Button>
            </Link>
          )
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Cliente</p>
          <p className="font-medium">{pedido.cliente.razaoSocial}</p>
          <p className="text-sm text-text-secondary">{pedido.cliente.enderecos[0]?.cidade}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Etapa</p>
          <Badge color="blue">{ETAPA_LABEL[pedido.etapa]}</Badge>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Data do Pedido / Entrega Prevista</p>
          <p className="text-sm">
            {formatarData(pedido.dataPedido)} → {formatarData(pedido.dataEntregaPrevista)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Situação de Prazo</p>
          {pedido.situacaoPrazo ? (
            <div>
              <Badge color={pedido.situacaoPrazo === "ATRASADO" ? "red" : pedido.situacaoPrazo === "ANTECIPADO" ? "green" : "blue"}>
                {SITUACAO_PRAZO_LABEL[pedido.situacaoPrazo]}
              </Badge>
              <p className="mt-1 text-xs text-text-secondary">{pedido.diasDiferenca} dia(s)</p>
            </div>
          ) : (
            <span className="text-sm text-text-tertiary">Aguardando finalização</span>
          )}
        </Card>
      </div>

      <Card className="mb-4">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Cor</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3">Valor Unit.</th>
              <th className="px-4 py-3">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item) => (
              <tr key={item.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3">
                  {item.produto.material} - {item.produto.medida}
                  {item.produto.micragem && ` (${item.produto.micragem})`}
                </td>
                <td className="px-4 py-3">{item.cor ?? "-"}</td>
                <td className="px-4 py-3">{item.quantidade}</td>
                <td className="px-4 py-3">{item.unidade}</td>
                <td className="px-4 py-3">{formatarMoeda(item.valorUnitario)}</td>
                <td className="px-4 py-3 font-medium">{formatarMoeda(item.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-8 border-t border-border-subtle px-4 py-3 text-sm">
          <div>
            <span className="text-text-secondary">Forma de Pagamento: </span>
            <span className="font-medium">{pedido.formaPagamento}</span>
          </div>
          <div>
            <span className="text-text-secondary">Desconto: </span>
            <span className="font-medium">{pedido.descontoPercentual}%</span>
          </div>
          <div>
            <span className="text-text-secondary">Total sem desconto: </span>
            <span className="font-medium">{formatarMoeda(pedido.valorTotal)}</span>
          </div>
          <div>
            <span className="text-text-secondary">Total com desconto: </span>
            <span className="font-semibold text-text-primary">{formatarMoeda(pedido.valorComDesconto)}</span>
          </div>
        </div>
      </Card>

      {pedido.observacoes && (
        <Card className="mb-4 p-4">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Observações</p>
          <p className="text-sm text-text-secondary">{pedido.observacoes}</p>
        </Card>
      )}

      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-wider text-text-tertiary">Histórico de etapas</p>
        <ul className="space-y-1 text-sm">
          {pedido.statusHist.map((h) => (
            <li key={h.id} className="text-text-secondary">
              {formatarData(h.em)} — {h.etapaAnterior ? `${ETAPA_LABEL[h.etapaAnterior]} → ` : ""}
              {ETAPA_LABEL[h.etapaNova]}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
