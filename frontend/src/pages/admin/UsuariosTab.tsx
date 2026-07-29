import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mensagemErro } from "../../lib/api";
import type { Perfil, UsuarioAdmin } from "../../lib/types";
import { Badge, Button, Card, ErrorText, Field, Input, Label, Select } from "../../components/ui";

export function UsuariosTab() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: async () => {
      const { data } = await api.get<UsuarioAdmin[]>("/usuarios");
      return data;
    },
  });

  const { data: perfis } = useQuery({
    queryKey: ["perfis-admin"],
    queryFn: async () => {
      const { data } = await api.get<Perfil[]>("/usuarios/perfis");
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      await api.post("/usuarios", { nome, email, senha, perfilId });
    },
    onSuccess: () => {
      setNome("");
      setEmail("");
      setSenha("");
      setPerfilId("");
      queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  const alternarStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/usuarios/${id}/status`, { ativo });
    },
    onSuccess: () => {
      setErro(null);
      queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    },
    onError: (error) => setErro(mensagemErro(error)),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    criar.mutate();
  }

  return (
    <div>
      <Card className="mb-4 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-tertiary">Novo usuário</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
          <Field>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
          <Field>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field>
            <Label>Senha inicial</Label>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required />
          </Field>
          <Field>
            <Label>Perfil</Label>
            <Select value={perfilId} onChange={(e) => setPerfilId(e.target.value)} required>
              <option value="">Selecione...</option>
              {perfis?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="col-span-4">
            <Button type="submit" disabled={criar.isPending}>
              Criar usuário
            </Button>
          </div>
        </form>
      </Card>

      <ErrorText>{erro}</ErrorText>

      <Card>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((u) => (
              <tr key={u.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3">{u.nome}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.perfil.nome}</td>
                <td className="px-4 py-3">
                  <Badge color={u.ativo ? "green" : "slate"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-sm text-text-secondary hover:underline"
                    onClick={() => alternarStatus.mutate({ id: u.id, ativo: !u.ativo })}
                  >
                    {u.ativo ? "Inativar" : "Ativar"}
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
