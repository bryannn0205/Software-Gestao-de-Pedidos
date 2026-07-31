import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import { BarChart3, Clock, DollarSign, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { mensagemErro } from "../lib/api";
import { Spinner } from "../components/ui";
import loginLeaves from "../assets/login-leaves.jpg";
import logoCubo from "../assets/logo-cubo.png";

const DESTAQUES = [
  { icon: Clock, label: "Mais\nOrganização" },
  { icon: BarChart3, label: "Mais\nProdutividade" },
  { icon: DollarSign, label: "Mais\nResultados" },
  { icon: ShieldCheck, label: "Mais\nControle" },
];

export function AuthField({
  label,
  icon: Icon,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon: typeof Mail; trailing?: ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
      <div
        className={clsx(
          "mt-1.5 flex items-center rounded-lg border bg-surface-3 px-3 py-3 transition-all duration-150 ease-out",
          isFocused
            ? "border-brand-500 ring-2 ring-brand-400/30"
            : "border-border-subtle hover:border-border-default"
        )}
      >
        <Icon size={16} className={clsx("transition-colors duration-150", isFocused ? "text-brand-400" : "text-text-tertiary")} />
        <input
          className="w-full bg-transparent px-3 py-0.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {trailing}
      </div>
    </label>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function LoginPage() {
  const { login, loginComGoogle, carregando, carregandoGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrarMe, setLembrarMe] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    setErro(null);
    if (!credentialResponse.credential) return;
    try {
      await loginComGoogle(credentialResponse.credential);
      navigate("/dashboard");
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* Painel do formulário */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-12 flex items-center gap-3">
            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-brand-400/30">
              <img src={logoCubo} alt="Extrusaick Polímeros" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-text-primary">Extrusaick Polímeros</p>
              <p className="text-xs text-text-secondary">Gestão de Pedidos</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight text-text-primary">Entrar</h1>
            <p className="mt-2 text-sm text-text-secondary">Acesse sua conta para continuar.</p>
          </div>

          {GOOGLE_CLIENT_ID && (
            <div className="mb-6">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <div className={clsx("flex justify-center [&>div]:w-full", carregando && "pointer-events-none opacity-60")}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErro("Erro ao fazer login com Google.")}
                    text="signin_with"
                    locale="pt-BR"
                    width="320"
                  />
                </div>
              </GoogleOAuthProvider>

              <div className="my-6 flex items-center gap-3">
                <hr className="flex-1 border-border-subtle" />
                <span className="text-xs text-text-tertiary">ou</span>
                <hr className="flex-1 border-border-subtle" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
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
                  className="transition-colors duration-150 text-text-tertiary hover:text-text-secondary"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer group text-text-secondary hover:text-text-primary transition-colors duration-150">
                <input
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="h-4 w-4 rounded border border-border-default bg-surface-3 accent-brand-500 cursor-pointer transition-all duration-150 group-hover:border-brand-400"
                />
                Lembrar-me
              </label>
              <button
                type="button"
                onClick={() => navigate("/esqueci-senha")}
                className="font-medium text-brand-400 hover:text-brand-300 transition-colors duration-150"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm text-danger"
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || carregandoGoogle}
              className={clsx(
                "w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-white",
                "bg-gradient-to-r from-brand-500 to-brand-600 py-3",
                "transition-all duration-150 ease-out",
                "hover:enabled:shadow-lg hover:enabled:shadow-brand-600/30",
                "active:enabled:scale-[0.98]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {carregando ? (
                <>
                  <Spinner className="text-white" />
                  <span>Entrando...</span>
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-xs text-text-tertiary">
            © {new Date().getFullYear()} Extrusaick Polímeros. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Painel de marca — ilustração e copy próprios */}
      <div className="relative hidden overflow-hidden bg-surface lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-12">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${loginLeaves})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,12,14,0.55), rgba(11,12,14,0.88)), radial-gradient(circle at 25% 20%, rgba(42,168,102,0.35), transparent 55%), radial-gradient(circle at 80% 75%, rgba(31,138,84,0.28), transparent 50%)",
          }}
        />

        <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600/40 to-brand-900/40 shadow-2xl ring-1 ring-brand-400/30">
          <ShieldCheck size={56} className="text-brand-300" />
        </div>

        <div className="relative z-10 max-w-sm px-10 text-center">
          <p className="text-3xl font-bold tracking-tight text-text-primary">Extrusaick Polímeros</p>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Controle de pedidos, produção e faturamento em um só lugar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 px-4">
          {DESTAQUES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-surface-2/50"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-600/20 group-hover:bg-brand-600/30 transition-colors duration-200">
                <Icon size={20} className="text-brand-300" />
              </div>
              <p className="whitespace-pre-line text-center text-xs font-medium text-text-secondary leading-snug">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
