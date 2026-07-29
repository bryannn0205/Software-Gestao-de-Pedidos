import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Dominio, TipoDominio } from "../../lib/types";
import { Badge, Button, Card, ErrorText, Input } from "../../components/ui";

const TIPOS: { valor: TipoDominio; label: string }[] = [
  { valor: "MATERIAL", label: "Material" },
  { valor: "COR", label: "Cor" },
  { valor: "MEDIDA", label: "Medida" },
  { valor: "MICRAGEM", label: "Micragem" },
  { valor: "TIPO_RESIDUO", label: "Tipo de Resíduo" },
  { valor: "FORMA_PAGAMENTO", label: "Forma de Pagamento" },
];

export function DominiosTab() {
  const [tipo, setTipo] = useState<TipoDominio>("MATERIAL");
  const [novoValor, setNovoValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: dominios } = useQuery({
    queryKey: ["dominios-admin", tipo],
    queryFn: async () => {
      const { data } = await api.get<Dominio[]>("/dominios", { params: { tipo } });
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      await api.post("/dominios", { tipo, valor: novoValor });
    },
    onSuccess: () => {
      setNovoValor("");
      queryClient.invalidateQueries({ queryKey: ["dominios-admin"] });
      queryClient.invalidateQueries({ queryKey: ["dominios"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  const alternarStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/dominios/${id}/status`, { ativo });
    },
    onSuccess: () => {
      setErro(null);
      queryClient.invalidateQueries({ queryKey: ["dominios-admin"] });
      queryClient.invalidateQueries({ queryKey: ["dominios"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    if (!novoValor.trim()) return;
    criar.mutate();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            onClick={() => setTipo(t.valor)}
            className={`rounded-md px-3 py-1.5 text-sm ${tipo === t.valor ? "bg-brand-500 text-white" : "bg-surface-2 text-text-secondary hover:bg-surface-3"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input placeholder="Novo valor..." value={novoValor} onChange={(e) => setNovoValor(e.target.value)} />
        <Button type="submit" disabled={criar.isPending}>
          Adicionar
        </Button>
      </form>
      <ErrorText>{erro}</ErrorText>

      <Card>
        <table className="w-full text-left text-sm">
          <tbody>
            {dominios?.map((d) => (
              <tr key={d.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3">{d.valor}</td>
                <td className="px-4 py-3">
                  <Badge color={d.ativo ? "green" : "slate"}>{d.ativo ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-sm text-text-secondary hover:underline"
                    onClick={() => alternarStatus.mutate({ id: d.id, ativo: !d.ativo })}
                  >
                    {d.ativo ? "Inativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
