import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Paginado, Produto } from "../../lib/types";
import { formatarMoeda } from "../../lib/format";
import { Badge, Button, Card, Input, PageHeader } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

export function ProdutosListPage() {
  const [search, setSearch] = useState("");
  const searchDebounced = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const { temPermissao } = useAuth();
  const podeEditar = temPermissao("produtos", "write");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["produtos", searchDebounced, page],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Produto>>("/produtos", {
        params: { search: searchDebounced, page, pageSize: 20 },
      });
      return data;
    },
  });

  const alternarStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/produtos/${id}/status`, { ativo });
    },
    onSuccess: () => {
      setErro(null);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  return (
    <div>
      <PageHeader
        title="Produtos"
        actions={
          podeEditar && (
            <Link to="/produtos/novo">
              <Button>Novo produto</Button>
            </Link>
          )
        }
      />

      {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}

      <Card className="mb-4 p-4">
        <Input
          placeholder="Buscar por material, medida ou linha..."
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
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Medida</th>
              <th className="px-4 py-3">Micragem</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Venda</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-tertiary">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-text-tertiary">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {data?.data.map((produto) => (
              <tr key={produto.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-text-secondary">{produto.codigo}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{produto.material}</td>
                <td className="px-4 py-3 text-text-secondary">{produto.medida}</td>
                <td className="px-4 py-3 text-text-secondary">{produto.micragem ?? "-"}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatarMoeda(produto.valorUnitario)}
                  {produto.tipoVenda === "KG" && ` / ${produto.pesoKg}kg`}
                </td>
                <td className="px-4 py-3 text-text-secondary">{produto.tipoVenda === "KG" ? "Kg" : "Unidade"}</td>
                <td className="px-4 py-3">
                  <Badge color={produto.ativo ? "green" : "slate"}>{produto.ativo ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {podeEditar && (
                    <div className="flex justify-end gap-2">
                      <Link to={`/produtos/${produto.id}`} className="text-sm text-brand-400 hover:text-brand-300 hover:underline">
                        Editar
                      </Link>
                      <button
                        className="text-sm text-text-secondary hover:underline"
                        onClick={() => alternarStatus.mutate({ id: produto.id, ativo: !produto.ativo })}
                      >
                        {produto.ativo ? "Inativar" : "Ativar"}
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
    </div>
  );
}
