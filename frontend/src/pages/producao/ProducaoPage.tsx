import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api, mensagemErro } from "../../lib/api";
import type { EtapaPedido, Paginado, Pedido } from "../../lib/types";
import { ETAPA_LABEL, SITUACAO_PRAZO_LABEL, formatarData, formatarMoeda } from "../../lib/format";
import { Badge, Button, Card, PageHeader } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../lib/auth-context";

const ETAPAS: EtapaPedido[] = ["EM_PRODUCAO", "FINALIZADO", "ENTREGUE"];

function ProximaEtapa(etapa: EtapaPedido): EtapaPedido | null {
  if (etapa === "EM_PRODUCAO") return "FINALIZADO";
  if (etapa === "FINALIZADO") return "ENTREGUE";
  return null;
}

export function ProducaoPage() {
  const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>("EM_PRODUCAO");
  const [page, setPage] = useState(1);
  const [dataFinalizacaoPendente, setDataFinalizacaoPendente] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState<Pedido | null>(null);
  const { temPermissao } = useAuth();
  const podeEditar = temPermissao("producao", "write");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["producao", etapaAtiva, page],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Pedido>>("/producao", {
        params: { etapa: etapaAtiva, page, pageSize: 20 },
      });
      return data;
    },
  });
  const pedidos = data?.data;

  function trocarEtapa(etapa: EtapaPedido) {
    setEtapaAtiva(etapa);
    setPage(1);
  }

  const mudarEtapa = useMutation({
    mutationFn: async ({ id, novaEtapa, dataFinalizacao }: { id: string; novaEtapa: EtapaPedido; dataFinalizacao?: string }) => {
      await api.patch(`/producao/${id}/etapa`, { novaEtapa, dataFinalizacao });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["producao"] }),
    onError: (error) => setErro(mensagemErro(error)),
  });

  function avancarEtapa(pedido: Pedido) {
    const proxima = ProximaEtapa(pedido.etapa);
    if (!proxima) return;
    setErro(null);

    if (proxima === "FINALIZADO") {
      const data = dataFinalizacaoPendente[pedido.id];
      if (!data) {
        setErro("Informe a data de finalização antes de confirmar.");
        return;
      }
      mudarEtapa.mutate({ id: pedido.id, novaEtapa: proxima, dataFinalizacao: data });
    } else {
      // "Entregue" não tem botão de desfazer na tela — confirma antes de aplicar.
      setConfirmandoEntrega(pedido);
    }
  }

  function confirmarEntrega() {
    if (!confirmandoEntrega) return;
    mudarEtapa.mutate({ id: confirmandoEntrega.id, novaEtapa: "ENTREGUE" });
    setConfirmandoEntrega(null);
  }

  return (
    <div>
      <PageHeader title="Produção" />

      <div className="mb-4 flex gap-2">
        {ETAPAS.map((etapa) => (
          <button
            key={etapa}
            onClick={() => trocarEtapa(etapa)}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-medium",
              etapaAtiva === etapa ? "bg-brand-500 text-white" : "bg-surface-2 text-text-secondary hover:bg-surface-3",
            )}
          >
            {ETAPA_LABEL[etapa]}
          </button>
        ))}
      </div>

      {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Data Pedido</th>
              <th className="px-4 py-3">Entrega Prevista</th>
              <th className="px-4 py-3">Forma Pagto</th>
              <th className="px-4 py-3">Valor</th>
              {etapaAtiva === "FINALIZADO" && <th className="px-4 py-3">Prazo</th>}
              {podeEditar && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-tertiary">Carregando...</td>
              </tr>
            )}
            {!isLoading && pedidos?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-tertiary">Nenhum pedido nesta etapa.</td>
              </tr>
            )}
            {pedidos?.map((pedido) => {
              const proxima = ProximaEtapa(pedido.etapa);
              return (
                <tr key={pedido.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/pedidos/${pedido.id}`} className="text-brand-400 hover:text-brand-300 hover:underline">
                      #{pedido.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{pedido.cliente.razaoSocial}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatarData(pedido.dataPedido)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatarData(pedido.dataEntregaPrevista)}</td>
                  <td className="px-4 py-3 text-text-secondary">{pedido.formaPagamento}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatarMoeda(pedido.valorComDesconto)}</td>
                  {etapaAtiva === "FINALIZADO" && (
                    <td className="px-4 py-3">
                      {pedido.situacaoPrazo && (
                        <Badge color={pedido.situacaoPrazo === "ATRASADO" ? "red" : pedido.situacaoPrazo === "ANTECIPADO" ? "green" : "blue"}>
                          {SITUACAO_PRAZO_LABEL[pedido.situacaoPrazo]}
                        </Badge>
                      )}
                    </td>
                  )}
                  {podeEditar && (
                    <td className="px-4 py-3 text-right">
                      {proxima === "FINALIZADO" && (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="date"
                            className="rounded-md border border-border-subtle bg-surface-3 px-2 py-1 text-xs text-text-primary"
                            value={dataFinalizacaoPendente[pedido.id] ?? ""}
                            onChange={(e) =>
                              setDataFinalizacaoPendente((prev) => ({ ...prev, [pedido.id]: e.target.value }))
                            }
                          />
                          <Button variant="secondary" onClick={() => avancarEtapa(pedido)} disabled={mudarEtapa.isPending}>
                            Finalizar
                          </Button>
                        </div>
                      )}
                      {proxima === "ENTREGUE" && (
                        <Button variant="secondary" onClick={() => avancarEtapa(pedido)} disabled={mudarEtapa.isPending}>
                          Marcar como Entregue
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
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

      <Modal
        open={confirmandoEntrega !== null}
        onClose={() => setConfirmandoEntrega(null)}
        title="Confirmar entrega"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmandoEntrega(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarEntrega} disabled={mudarEtapa.isPending}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          Marcar o pedido #{confirmandoEntrega?.numero} como entregue? Depois disso não há um botão para desfazer
          nesta tela.
        </p>
      </Modal>
    </div>
  );
}
