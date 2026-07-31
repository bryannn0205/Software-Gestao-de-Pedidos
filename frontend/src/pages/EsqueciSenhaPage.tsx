import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { api, mensagemErro } from "../lib/api";
import { Spinner } from "../components/ui";
import { AuthField } from "./LoginPage";
import logoCubo from "../assets/logo-cubo.png";

export function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.post("/auth/esqueci-senha", { email });
      setEnviado(true);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-8 py-12">
      <div className="w-full max-w-sm">
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
          <h1 className="text-3xl font-bold leading-tight text-text-primary">Esqueceu sua senha?</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Informe seu e-mail. Se ele existir na nossa base, enviamos um link para redefinir sua senha.
          </p>
        </div>

        {enviado ? (
          <div
            role="status"
            className="rounded-lg bg-brand-500/10 border border-brand-400/20 px-4 py-3 text-sm text-text-secondary"
          >
            Se esse e-mail existir na nossa base, enviamos um link de redefinição de senha. Verifique sua caixa de
            entrada (e o spam).
          </div>
        ) : (
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

            {erro && (
              <div role="alert" className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-sm text-danger">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 py-3 transition-all duration-150 ease-out hover:enabled:shadow-lg hover:enabled:shadow-brand-600/30 active:enabled:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Spinner className="text-white" />
                  <span>Enviando...</span>
                </>
              ) : (
                "Enviar link de redefinição"
              )}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-8 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <ArrowLeft size={15} />
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
