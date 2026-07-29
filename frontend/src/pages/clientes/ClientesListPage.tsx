import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import clsx from "clsx";
import { api, mensagemErro } from "../../lib/api";
import type { Cliente, Paginado } from "../../lib/types";
import { Badge, Button, Card, Input, PageHeader } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { useAuth } from "../../lib/auth-context";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

export function ClientesListPage() {
  const [search, setSearch] = useState("");
  const searchDebounced = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  // Cliente selecionado ao clicar na linha — usado pelo botão de excluir na barra de cima.
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const { temPermissao } = useAuth();
  const podeEditar = temPermissao("clientes", "write");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clientes", searchDebounced, page],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Cliente>>("/clientes", {
        params: { search: searchDebounced, page, pageSize: 20 },
      });
      return data;
    },
  });

  const clienteSelecionado = data?.data.find((c) => c.id === selecionadoId) ?? null;

  // Some sozinha depois de alguns segundos — evita ficar uma mensagem de
  // sucesso "pendurada" na tela indefinidamente.
  useEffect(() => {
    if (!sucesso) return;
    const timer = setTimeout(() => setSucesso(null), 4000);
    return () => clearTimeout(timer);
  }, [sucesso]);

  const alternarStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/clientes/${id}/status`, { ativo });
    },
    onSuccess: () => {
      setErro(null);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  const excluirCliente = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clientes/${id}`);
    },
    onSuccess: () => {
      setErro(null);
      setSucesso("Cliente deletado com sucesso");
      setSelecionadoId(null);
      setConfirmandoExclusao(false);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error) => {
      setErro(mensagemErro(error));
      setConfirmandoExclusao(false);
    },
  });

  function selecionarLinha(id: string) {
    setSelecionadoId((atual) => (atual === id ? null : id));
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        actions={
          podeEditar && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                disabled={!selecionadoId}
                aria-label="Excluir cliente selecionado"
                title={selecionadoId ? "Excluir cliente selecionado" : "Selecione um cliente na lista para excluir"}
                className={clsx(
                  "flex items-center justify-center rounded-lg border border-border-subtle p-2 transition-colors",
                  selecionadoId
                    ? "text-danger hover:bg-danger/10"
                    : "cursor-not-allowed text-text-tertiary opacity-50",
                )}
              >
                <Trash2 size={18} />
              </button>
              <Link to="/clientes/novo">
                <Button>Novo cliente</Button>
              </Link>
            </div>
          )
        }
      />

      {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
      {sucesso && <p className="mb-3 text-sm text-success">{sucesso}</p>}

      <Card className="mb-4 p-4">
        <Input
          placeholder="Buscar por nome, CNPJ/CPF ou cidade..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Razão Social</th>
              <th className="px-4 py-3">CNPJ/CPF</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-tertiary">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-tertiary">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {data?.data.map((cliente) => (
              <tr
                key={cliente.id}
                onClick={() => podeEditar && selecionarLinha(cliente.id)}
                className={clsx(
                  "border-b border-border-subtle last:border-0",
                  podeEditar && "cursor-pointer",
                  selecionadoId === cliente.id ? "bg-brand-500/10" : "hover:bg-surface-2",
                )}
              >
                <td className="px-4 py-3 font-medium text-text-primary">{cliente.razaoSocial}</td>
                <td className="px-4 py-3 text-text-secondary">{cliente.cnpjCpf}</td>
                <td className="px-4 py-3 text-text-secondary">{cliente.enderecos[0]?.cidade ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge color={cliente.ativo ? "green" : "slate"}>{cliente.ativo ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {podeEditar && (
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/clientes/${cliente.id}`} className="text-sm text-brand-400 hover:text-brand-300 hover:underline">
                        Editar
                      </Link>
                      <button
                        className="text-sm text-text-secondary hover:underline"
                        onClick={() => alternarStatus.mutate({ id: cliente.id, ativo: !cliente.ativo })}
                      >
                        {cliente.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </div>
                  )}
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

      <Modal
        open={confirmandoExclusao}
        onClose={() => setConfirmandoExclusao(false)}
        title="Excluir cliente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => selecionadoId && excluirCliente.mutate(selecionadoId)}
              disabled={excluirCliente.isPending}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          Tem certeza que deseja deletar este cliente
          {clienteSelecionado ? ` (${clienteSelecionado.razaoSocial})` : ""}? Essa ação não pode ser desfeita. Se o
          cliente já tiver pedidos, a exclusão será bloqueada — use "Inativar" nesse caso.
        </p>
      </Modal>
    </div>
  );
}
