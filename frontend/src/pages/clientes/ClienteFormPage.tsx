import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Cliente } from "../../lib/types";
import { Button, Card, ErrorText, Field, Input, Label, PageHeader } from "../../components/ui";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface FormState {
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  inscricaoEstadual: string;
  email: string;
  telefone: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

const ESTADO_INICIAL: FormState = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpjCpf: "",
  inscricaoEstadual: "",
  email: "",
  telefone: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "SP",
  cep: "",
};

function clienteParaForm(cliente: Cliente): FormState {
  const endereco = cliente.enderecos.find((e) => e.principal) ?? cliente.enderecos[0];
  return {
    razaoSocial: cliente.razaoSocial,
    nomeFantasia: cliente.nomeFantasia ?? "",
    cnpjCpf: cliente.cnpjCpf,
    inscricaoEstadual: cliente.inscricaoEstadual ?? "",
    email: cliente.email ?? "",
    telefone: cliente.telefone ?? "",
    logradouro: endereco?.logradouro ?? "",
    numero: endereco?.numero ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    uf: endereco?.uf ?? "SP",
    cep: endereco?.cep ?? "",
  };
}

export function ClienteFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: cliente } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const { data } = await api.get<Cliente>(`/clientes/${id}`);
      return data;
    },
    enabled: editando,
  });

  useEffect(() => {
    if (cliente) setForm(clienteParaForm(cliente));
  }, [cliente]);

  function update<K extends keyof FormState>(campo: K, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = {
      razaoSocial: form.razaoSocial,
      nomeFantasia: form.nomeFantasia || undefined,
      cnpjCpf: form.cnpjCpf,
      inscricaoEstadual: form.inscricaoEstadual || undefined,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      endereco: {
        logradouro: form.logradouro,
        numero: form.numero || undefined,
        bairro: form.bairro || undefined,
        cidade: form.cidade,
        uf: form.uf,
        cep: form.cep || undefined,
      },
    };

    try {
      if (editando) {
        await api.put(`/clientes/${id}`, payload);
      } else {
        await api.post("/clientes", payload);
      }
      navigate("/clientes");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader title={editando ? "Editar cliente" : "Novo cliente"} />
      <form onSubmit={handleSubmit}>
        <Card className="mb-4 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Dados fiscais</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Razão Social *</Label>
              <Input value={form.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} required />
            </Field>
            <Field>
              <Label>Nome Fantasia</Label>
              <Input value={form.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} />
            </Field>
            <Field>
              <Label>CNPJ/CPF *</Label>
              <Input value={form.cnpjCpf} onChange={(e) => update("cnpjCpf", e.target.value)} required />
            </Field>
            <Field>
              <Label>Inscrição Estadual</Label>
              <Input value={form.inscricaoEstadual} onChange={(e) => update("inscricaoEstadual", e.target.value)} />
            </Field>
            <Field>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="mb-4 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Endereço</h2>
          <div className="grid grid-cols-4 gap-4">
            <Field>
              <Label>Logradouro *</Label>
              <Input value={form.logradouro} onChange={(e) => update("logradouro", e.target.value)} required />
            </Field>
            <Field>
              <Label>Número</Label>
              <Input value={form.numero} onChange={(e) => update("numero", e.target.value)} />
            </Field>
            <Field>
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => update("bairro", e.target.value)} />
            </Field>
            <Field>
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} />
            </Field>
            <Field>
              <Label>Cidade *</Label>
              <Input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} required />
            </Field>
            <Field>
              <Label>UF *</Label>
              <select
                className="w-full rounded-md border border-border-subtle bg-surface-3 px-3 py-2 text-sm text-text-primary"
                value={form.uf}
                onChange={(e) => update("uf", e.target.value)}
              >
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <ErrorText>{erro}</ErrorText>

        <div className="flex gap-2">
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/clientes")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
