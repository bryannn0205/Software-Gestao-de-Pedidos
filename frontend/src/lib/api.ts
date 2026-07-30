import axios from "axios";

// Sem VITE_API_URL definida (build de produção usada pelo app desktop), usa
// caminho relativo — funciona porque nesse modo o próprio backend serve o
// frontend, então API e página estão na mesma origem.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const estavaAutenticado = Boolean(localStorage.getItem("token"));
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (estavaAutenticado && !window.location.pathname.startsWith("/login")) {
        // Avisa antes de redirecionar — sem isso, o usuário perdia qualquer
        // formulário em preenchimento (ex.: um pedido longo) sem entender por quê.
        window.alert("Sua sessão expirou ou foi encerrada. Você será redirecionado para a tela de login.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Rótulos em pt-BR para os nomes de campo usados nos formulários — usados para
// indicar QUAL campo está inválido (antes, toda validação virava "Dados inválidos.").
const CAMPO_LABEL: Record<string, string> = {
  razaoSocial: "Razão Social",
  nomeFantasia: "Nome Fantasia",
  cnpjCpf: "CNPJ/CPF",
  inscricaoEstadual: "Inscrição Estadual",
  email: "E-mail",
  telefone: "Telefone",
  logradouro: "Logradouro",
  numero: "Número",
  bairro: "Bairro",
  cidade: "Cidade",
  uf: "UF",
  cep: "CEP",
  material: "Material",
  medida: "Medida",
  micragem: "Micragem",
  corPadrao: "Cor padrão",
  valorUnitario: "Valor Unitário",
  tipoVenda: "Tipo de Venda",
  pesoKg: "Peso (Kg)",
  clienteId: "Cliente",
  produtoId: "Produto",
  quantidade: "Quantidade",
  cor: "Cor",
  dataPedido: "Data do Pedido",
  dataEntregaPrevista: "Data de Entrega Prevista",
  formaPagamento: "Forma de Pagamento",
  descontoPercentual: "Desconto",
  observacoes: "Observações",
  itens: "Itens do pedido",
  nome: "Nome",
  senha: "Senha",
  perfilId: "Perfil",
  valor: "Valor",
  tipo: "Tipo",
};

interface ZodIssueLike {
  path?: (string | number)[];
  message: string;
}

export function mensagemErro(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const issues = data?.issues as ZodIssueLike[] | undefined;

    if (Array.isArray(issues) && issues.length > 0) {
      const detalhes = issues
        .map((issue) => {
          const campo = issue.path?.filter((parte) => typeof parte === "string").pop() as string | undefined;
          const label = campo ? CAMPO_LABEL[campo] ?? campo : null;
          return label ? `${label}: ${issue.message}` : issue.message;
        })
        .join(" | ");
      return detalhes || data?.message || "Dados inválidos.";
    }

    return data?.message ?? "Erro de comunicação com o servidor.";
  }
  return "Erro inesperado.";
}
