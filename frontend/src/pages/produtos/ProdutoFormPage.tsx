import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Dominio, Produto } from "../../lib/types";
import { Button, Card, ErrorText, Field, Label, PageHeader, Select } from "../../components/ui";

interface FormState {
  linha: string;
  material: string;
  medida: string;
  micragem: string;
  corPadrao: string;
  valorUnitario: string;
  tipoVenda: "UNIDADE" | "KG";
  pesoKg: string;
}

const ESTADO_INICIAL: FormState = {
  linha: "",
  material: "",
  medida: "",
  micragem: "",
  corPadrao: "",
  valorUnitario: "",
  tipoVenda: "UNIDADE",
  pesoKg: "",
};

function useDominio(tipo: string) {
  return useQuery({
    queryKey: ["dominios", tipo],
    queryFn: async () => {
      const { data } = await api.get<Dominio[]>("/dominios", { params: { tipo, ativo: true } });
      return data;
    },
  });
}

export function ProdutoFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: materiais } = useDominio("MATERIAL");
  const { data: micragens } = useDominio("MICRAGEM");
  const { data: cores } = useDominio("COR");

  const { data: produto } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data } = await api.get<Produto>(`/produtos/${id}`);
      return data;
    },
    enabled: editando,
  });

  useEffect(() => {
    if (produto) {
      setForm({
        linha: produto.linha ?? "",
        material: produto.material,
        medida: produto.medida,
        micragem: produto.micragem ?? "",
        corPadrao: produto.corPadrao ?? "",
        valorUnitario: produto.valorUnitario,
        tipoVenda: produto.tipoVenda,
        pesoKg: produto.pesoKg ?? "",
      });
    }
  }, [produto]);

  function update<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = {
      linha: form.linha || undefined,
      material: form.material,
      medida: form.medida,
      micragem: form.micragem || undefined,
      corPadrao: form.corPadrao || undefined,
      valorUnitario: Number(form.valorUnitario),
      tipoVenda: form.tipoVenda,
      pesoKg: form.tipoVenda === "KG" ? Number(form.pesoKg) : undefined,
    };

    try {
      if (editando) {
        await api.put(`/produtos/${id}`, payload);
      } else {
        await api.post("/produtos", payload);
      }
      navigate("/produtos");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader title={editando ? "Editar produto" : "Novo produto"} />
      <form onSubmit={handleSubmit}>
        <Card className="mb-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Linha</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={form.linha}
                onChange={(e) => update("linha", e.target.value)}
                placeholder="Ex.: EL-Pack Super Reforçado"
              />
            </Field>
            <Field>
              <Label>Material *</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                list="materiais"
                value={form.material}
                onChange={(e) => update("material", e.target.value)}
                required
              />
              <datalist id="materiais">
                {materiais?.map((m) => <option key={m.id} value={m.valor} />)}
              </datalist>
            </Field>
            <Field>
              <Label>Medida *</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={form.medida}
                onChange={(e) => update("medida", e.target.value)}
                placeholder="Ex.: 60L - 75x85cm - 10un"
                required
              />
            </Field>
            <Field>
              <Label>Micragem</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                list="micragens"
                value={form.micragem}
                onChange={(e) => update("micragem", e.target.value)}
              />
              <datalist id="micragens">
                {micragens?.map((m) => <option key={m.id} value={m.valor} />)}
              </datalist>
            </Field>
            <Field>
              <Label>Cor padrão</Label>
              <input
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                list="cores"
                value={form.corPadrao}
                onChange={(e) => update("corPadrao", e.target.value)}
              />
              <datalist id="cores">
                {cores?.map((c) => <option key={c.id} value={c.valor} />)}
              </datalist>
            </Field>
            <Field>
              <Label>Tipo de Venda *</Label>
              <Select value={form.tipoVenda} onChange={(e) => update("tipoVenda", e.target.value as "UNIDADE" | "KG")}>
                <option value="UNIDADE">Unidade</option>
                <option value="KG">Kg</option>
              </Select>
            </Field>
            <Field>
              <Label>Valor Unitário (R$) *</Label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={form.valorUnitario}
                onChange={(e) => update("valorUnitario", e.target.value)}
                required
              />
            </Field>
            {form.tipoVenda === "KG" && (
              <Field>
                <Label>Peso (Kg) *</Label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                  value={form.pesoKg}
                  onChange={(e) => update("pesoKg", e.target.value)}
                  required
                />
              </Field>
            )}
          </div>
        </Card>

        <ErrorText>{erro}</ErrorText>

        <div className="flex gap-2">
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/produtos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
