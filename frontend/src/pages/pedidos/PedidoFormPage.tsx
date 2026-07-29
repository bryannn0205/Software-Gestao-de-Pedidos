import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Cliente, Dominio, Pedido, Produto } from "../../lib/types";
import { formatarMoeda, paraInputDate } from "../../lib/format";
import { Button, Card, ErrorText, Field, Label, PageHeader, Select } from "../../components/ui";
import { ComboBox } from "../../components/ComboBox";

interface ItemForm {
  chave: string;
  produto: Produto | null;
  cor: string;
  quantidade: string;
}

function novoItem(): ItemForm {
  return { chave: crypto.randomUUID(), produto: null, cor: "", quantidade: "1" };
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function somarDias(dataISO: string, dias: number) {
  const data = new Date(`${dataISO}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function calcularValorUnitario(produto: Produto): number {
  return produto.tipoVenda === "KG" && produto.pesoKg
    ? Number(produto.valorUnitario) / Number(produto.pesoKg)
    : Number(produto.valorUnitario);
}

export function PedidoFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [dataPedido, setDataPedido] = useState(hojeISO());
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [descontoPercentual, setDescontoPercentual] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: prazoPadrao } = useQuery({
    queryKey: ["prazo-padrao-dias"],
    queryFn: async () => {
      const { data } = await api.get<{ dias: number }>("/parametros/prazo-padrao-dias");
      return data.dias;
    },
    enabled: !editando,
  });

  const { data: formasPagamento } = useQuery({
    queryKey: ["dominios", "FORMA_PAGAMENTO"],
    queryFn: async () => {
      const { data } = await api.get<Dominio[]>("/dominios", { params: { tipo: "FORMA_PAGAMENTO", ativo: true } });
      return data;
    },
  });

  const { data: pedido, isLoading: carregandoPedido } = useQuery({
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data } = await api.get<Pedido>(`/pedidos/${id}`);
      return data;
    },
    enabled: editando,
  });

  useEffect(() => {
    if (!editando && prazoPadrao && !dataEntregaPrevista) {
      setDataEntregaPrevista(somarDias(dataPedido, prazoPadrao));
    }
  }, [prazoPadrao, editando, dataPedido, dataEntregaPrevista]);

  useEffect(() => {
    if (pedido) {
      setCliente(pedido.cliente);
      setDataPedido(paraInputDate(pedido.dataPedido));
      setDataEntregaPrevista(paraInputDate(pedido.dataEntregaPrevista));
      setFormaPagamento(pedido.formaPagamento);
      setDescontoPercentual(pedido.descontoPercentual);
      setObservacoes(pedido.observacoes ?? "");
      setItens(
        pedido.itens.map((item) => ({
          chave: item.id,
          produto: item.produto,
          cor: item.cor ?? "",
          quantidade: item.quantidade,
        })),
      );
    }
  }, [pedido]);

  const podeEditarPedido = !editando || pedido?.etapa === "EM_PRODUCAO";

  function atualizarItem(chave: string, patch: Partial<ItemForm>) {
    setItens((prev) => prev.map((item) => (item.chave === chave ? { ...item, ...patch } : item)));
  }

  function removerItem(chave: string) {
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.chave !== chave) : prev));
  }

  const valorTotal = itens.reduce((acc, item) => {
    if (!item.produto || !item.quantidade) return acc;
    return acc + calcularValorUnitario(item.produto) * Number(item.quantidade);
  }, 0);
  const valorComDesconto = valorTotal * (1 - Number(descontoPercentual || 0) / 100);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (!cliente) {
      setErro("Selecione um cliente.");
      return;
    }
    if (itens.some((item) => !item.produto)) {
      setErro("Selecione o produto de todos os itens.");
      return;
    }

    setSalvando(true);
    const payload = {
      clienteId: cliente.id,
      dataPedido,
      dataEntregaPrevista: dataEntregaPrevista || undefined,
      formaPagamento,
      descontoPercentual: Number(descontoPercentual || 0),
      observacoes: observacoes || undefined,
      itens: itens.map((item) => ({
        produtoId: item.produto!.id,
        cor: item.cor || undefined,
        quantidade: Number(item.quantidade),
      })),
    };

    try {
      if (editando) {
        await api.put(`/pedidos/${id}`, payload);
      } else {
        await api.post("/pedidos", payload);
      }
      navigate("/pedidos");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  if (editando && carregandoPedido) {
    return <p className="text-text-tertiary">Carregando pedido...</p>;
  }

  if (editando && !podeEditarPedido) {
    return (
      <div>
        <PageHeader title={`Pedido #${pedido?.numero}`} />
        <Card className="p-6 text-text-secondary">
          Este pedido não pode mais ser editado porque já está na etapa "{pedido?.etapa}".
          Alterações de itens/valores só são permitidas enquanto o pedido está Em Produção.
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={editando ? `Editar pedido #${pedido?.numero}` : "Novo pedido"} />
      <form onSubmit={handleSubmit}>
        <Card className="mb-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <Field>
              <Label>Cliente *</Label>
              <ComboBox<Cliente>
                queryKey="clientes-combo"
                initialLabel={cliente?.razaoSocial ?? ""}
                placeholder="Buscar cliente..."
                fetchOptions={async (search) => {
                  const { data } = await api.get<{ data: Cliente[] }>("/clientes", {
                    params: { search, ativo: true, pageSize: 10 },
                  });
                  return data.data;
                }}
                getId={(c) => c.id}
                getLabel={(c) => c.razaoSocial}
                onSelect={setCliente}
              />
            </Field>
            <Field>
              <Label>Cidade</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-tertiary"
                value={cliente?.enderecos[0]?.cidade ?? ""}
                disabled
                readOnly
              />
            </Field>
            <Field>
              <Label>Forma de Pagamento *</Label>
              <Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} required>
                <option value="">Selecione...</option>
                {formasPagamento?.map((f) => (
                  <option key={f.id} value={f.valor}>
                    {f.valor}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Data do Pedido *</Label>
              <input
                type="date"
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                required
              />
            </Field>
            <Field>
              <Label>Data de Entrega Prevista *</Label>
              <input
                type="date"
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={dataEntregaPrevista}
                onChange={(e) => setDataEntregaPrevista(e.target.value)}
                min={dataPedido}
                required
              />
            </Field>
            <Field>
              <Label>Desconto (%)</Label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={descontoPercentual}
                onChange={(e) => setDescontoPercentual(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <Label>Observações</Label>
            <textarea
              className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Field>
        </Card>

        <Card className="mb-4 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Itens do pedido</h2>
            <Button type="button" variant="secondary" onClick={() => setItens((prev) => [...prev, novoItem()])}>
              + Adicionar item
            </Button>
          </div>

          {itens.map((item) => {
            const valorUnitarioPreview = item.produto ? calcularValorUnitario(item.produto) : 0;
            const valorTotalItem = valorUnitarioPreview * Number(item.quantidade || 0);
            return (
              <div key={item.chave} className="mb-3 grid grid-cols-12 gap-2 border-b border-border-subtle pb-3">
                <div className="col-span-4">
                  <ComboBox<Produto>
                    queryKey="produtos-combo"
                    initialLabel={item.produto ? `${item.produto.material} - ${item.produto.medida}` : ""}
                    placeholder="Buscar produto..."
                    fetchOptions={async (search) => {
                      const { data } = await api.get<{ data: Produto[] }>("/produtos", {
                        params: { search, ativo: true, pageSize: 10 },
                      });
                      return data.data;
                    }}
                    getId={(p) => p.id}
                    getLabel={(p) => `${p.material} - ${p.medida}`}
                    onSelect={(produto) => atualizarItem(item.chave, { produto })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                    placeholder="Cor"
                    value={item.cor}
                    onChange={(e) => atualizarItem(item.chave, { cor: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                    placeholder="Quantidade"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(item.chave, { quantidade: e.target.value })}
                  />
                </div>
                <div className="col-span-1 flex items-center text-sm text-text-secondary">
                  {item.produto ? (item.produto.tipoVenda === "KG" ? "Kg" : "pç") : "-"}
                </div>
                <div className="col-span-2 flex items-center text-sm font-medium text-text-secondary">
                  {formatarMoeda(valorTotalItem)}
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    className="text-sm text-danger hover:underline"
                    onClick={() => removerItem(item.chave)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}

          <div className="mt-4 flex justify-end gap-8 text-sm">
            <div>
              <span className="text-text-secondary">Total sem desconto: </span>
              <span className="font-medium">{formatarMoeda(valorTotal)}</span>
            </div>
            <div>
              <span className="text-text-secondary">Total com desconto: </span>
              <span className="font-semibold text-text-primary">{formatarMoeda(valorComDesconto)}</span>
            </div>
          </div>
        </Card>

        <ErrorText>{erro}</ErrorText>

        <div className="flex gap-2">
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar pedido"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/pedidos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
