import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import { Button, Card, ErrorText, Field, Input, Label } from "../../components/ui";

interface Parametro {
  chave: string;
  valor: string;
}

const ROTULOS: Record<string, string> = {
  prazo_padrao_dias: "Prazo padrão de entrega (dias)",
  empresa_nome: "Nome da empresa",
  empresa_marca: "Marca comercial",
  empresa_cnpj: "CNPJ",
  empresa_telefone: "Telefone",
  empresa_cidade_uf: "Cidade/UF",
};

export function ParametrosTab() {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [proximoNumero, setProximoNumero] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: parametros } = useQuery({
    queryKey: ["parametros-admin"],
    queryFn: async () => {
      const { data } = await api.get<Parametro[]>("/parametros");
      return data;
    },
  });

  const { data: sequencia } = useQuery({
    queryKey: ["sequencia-pedido"],
    queryFn: async () => {
      const { data } = await api.get<{ proximoNumero: number }>("/parametros/sequencia-pedido");
      return data;
    },
  });

  useEffect(() => {
    if (parametros) {
      setValores(Object.fromEntries(parametros.map((p) => [p.chave, p.valor])));
    }
  }, [parametros]);

  useEffect(() => {
    if (sequencia) setProximoNumero(String(sequencia.proximoNumero));
  }, [sequencia]);

  const salvarParametro = useMutation({
    mutationFn: async (chave: string) => {
      await api.put(`/parametros/${chave}`, { valor: valores[chave] });
    },
    onSuccess: () => {
      setMensagem("Parâmetro salvo.");
      queryClient.invalidateQueries({ queryKey: ["parametros-admin"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  const salvarSequencia = useMutation({
    mutationFn: async () => {
      await api.put("/parametros/sequencia-pedido", { proximoNumero: Number(proximoNumero) });
    },
    onSuccess: () => {
      setMensagem("Sequência de numeração atualizada.");
      queryClient.invalidateQueries({ queryKey: ["sequencia-pedido"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  function handleSubmitSequencia(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    salvarSequencia.mutate();
  }

  return (
    <div className="max-w-xl">
      <Card className="mb-4 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Parâmetros gerais</h2>
        {Object.entries(ROTULOS).map(([chave, rotulo]) => (
          <Field key={chave}>
            <Label>{rotulo}</Label>
            <div className="flex gap-2">
              <Input
                value={valores[chave] ?? ""}
                onChange={(e) => setValores((prev) => ({ ...prev, [chave]: e.target.value }))}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setErro(null);
                  setMensagem(null);
                  salvarParametro.mutate(chave);
                }}
              >
                Salvar
              </Button>
            </div>
          </Field>
        ))}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Numeração de pedidos</h2>
        <form onSubmit={handleSubmitSequencia}>
          <Field>
            <Label>Próximo número de pedido a ser gerado</Label>
            <Input type="number" min="1" value={proximoNumero} onChange={(e) => setProximoNumero(e.target.value)} />
          </Field>
          <Button type="submit" disabled={salvarSequencia.isPending}>
            Salvar
          </Button>
        </form>
      </Card>

      {mensagem && <p className="mt-3 text-sm text-success">{mensagem}</p>}
      <ErrorText>{erro}</ErrorText>
    </div>
  );
}
