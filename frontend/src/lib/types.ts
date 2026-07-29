export type Modulo = "clientes" | "produtos" | "pedidos" | "producao" | "financeiro" | "dashboard" | "admin";
export type Acao = "read" | "write";
export type Permissoes = Partial<Record<Modulo, Acao[]>>;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  permissoes: Permissoes;
}

export interface Endereco {
  id: string;
  logradouro: string;
  numero?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  cep?: string | null;
  principal: boolean;
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpjCpf: string;
  inscricaoEstadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  criadoEm: string;
  enderecos: Endereco[];
}

export type TipoVenda = "UNIDADE" | "KG";

export interface Produto {
  id: string;
  codigo: number;
  linha?: string | null;
  material: string;
  medida: string;
  micragem?: string | null;
  corPadrao?: string | null;
  valorUnitario: string;
  tipoVenda: TipoVenda;
  pesoKg?: string | null;
  ativo: boolean;
}

export type EtapaPedido = "EM_PRODUCAO" | "FINALIZADO" | "ENTREGUE";
export type SituacaoPrazo = "ANTECIPADO" | "NO_PRAZO" | "ATRASADO";

export interface ItemPedido {
  id: string;
  produtoId: string;
  produto: Produto;
  cor?: string | null;
  quantidade: string;
  unidade: string;
  valorUnitario: string;
  valorTotal: string;
}

export interface PedidoStatusHist {
  id: string;
  etapaAnterior?: EtapaPedido | null;
  etapaNova: EtapaPedido;
  em: string;
}

export interface Pedido {
  id: string;
  numero: number;
  clienteId: string;
  cliente: Cliente;
  dataPedido: string;
  dataEntregaPrevista: string;
  dataFinalizacao?: string | null;
  etapa: EtapaPedido;
  formaPagamento: string;
  descontoPercentual: string;
  valorTotal: string;
  valorComDesconto: string;
  observacoes?: string | null;
  situacaoPrazo?: SituacaoPrazo | null;
  diasDiferenca?: number | null;
  itens: ItemPedido[];
  statusHist: PedidoStatusHist[];
}

export interface Paginado<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type TipoDominio = "MATERIAL" | "COR" | "MEDIDA" | "MICRAGEM" | "TIPO_RESIDUO" | "FORMA_PAGAMENTO";

export interface Dominio {
  id: string;
  tipo: TipoDominio;
  valor: string;
  ativo: boolean;
}

export interface Perfil {
  id: string;
  nome: string;
  permissoes: Permissoes;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
  perfil: Perfil;
}
