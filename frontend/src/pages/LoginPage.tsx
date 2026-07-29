import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { BarChart3, Clock, DollarSign, Eye, EyeOff, Lock, Mail, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { mensagemErro } from "../lib/api";
import { Spinner } from "../components/ui";
import { Modal } from "../components/Modal";

const DESTAQUES = [
  { icon: Clock, label: "Mais\nOrganização" },
  { icon: BarChart3, label: "Mais\nProdutividade" },
  { icon: DollarSign, label: "Mais\nResultados" },
  { icon: ShieldCheck, label: "Mais\nControle" },
];

function AuthField({
  label,
  icon: Icon,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon: typeof Mail; trailing?: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</span>
      <div className="mt-2 flex items-center rounded-xl border border-border-subtle bg-surface-3 px-3 focus-within:border-brand-500">
        <Icon size={16} className="text-text-tertiary" />
        <input
          className="w-full bg-transparent px-3 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          {...props}
        />
        {trailing}
      </div>
    </label>
  );
}

export function LoginPage() {
  const { login, carregando } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrarMe, setLembrarMe] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    try {
      await login(email, senha, lembrarMe);
      navigate("/dashboard");
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* Painel do formulário */}
      <div className="flex flex-col justify-center px-8 py-16 sm:px-16 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-text-primary">EL-PACK</p>
              <p className="text-xs text-text-secondary">Gestão de Pedidos</p>
            </div>
          </div>

          <h1 className="mb-1 text-[28px] font-semibold leading-tight text-text-primary">Entrar</h1>
          <p className="mb-8 text-sm text-text-secondary">Acesse sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthField
              label="E-mail"
              icon={Mail}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <AuthField
              label="Senha"
              icon={Lock}
              type={mostrarSenha ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="text-text-tertiary hover:text-text-secondary"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-text-secondary">
                <input
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border-default bg-surface-3 accent-brand-500"
                />
                Lembrar-me
              </label>
              <button
                type="button"
                onClick={() => setModalSenhaAberto(true)}
                className="font-medium text-brand-400 hover:text-brand-300"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {erro && (
              <p role="alert" className="text-sm text-danger">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className={clsx(
                "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3",
                "text-sm font-semibold text-white transition-opacity hover:opacity-90",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {carregando && <Spinner />}
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} EL-PACK. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Painel de marca — ilustração e copy próprios */}
      <div className="relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, rgba(42,168,102,0.35), transparent 55%), radial-gradient(circle at 80% 75%, rgba(31,138,84,0.28), transparent 50%)",
          }}
        />

        <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600/40 to-brand-900/40 shadow-2xl ring-1 ring-brand-400/30">
          <ShieldCheck size={56} className="text-brand-300" />
        </div>

        <div className="relative z-10 max-w-sm px-10 text-center">
          <p className="text-3xl font-semibold text-text-primary">EL-PACK</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Controle de pedidos, produção e faturamento em um só lugar.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {DESTAQUES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon size={20} className="text-brand-400" />
              <p className="whitespace-pre-line text-center text-xs text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalSenhaAberto} onClose={() => setModalSenhaAberto(false)} title="Esqueceu sua senha?">
        <p>
          Por enquanto, a redefinição de senha é feita pelo administrador do sistema. Contate quem administra o
          EL-PACK na sua empresa para receber uma nova senha de acesso.
        </p>
      </Modal>
    </div>
  );
}
