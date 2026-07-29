export function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
}

export function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

export function paraInputDate(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export const ETAPA_LABEL: Record<string, string> = {
  EM_PRODUCAO: "Em Produção",
  FINALIZADO: "Finalizado",
  ENTREGUE: "Entregue (OK)",
};

export const SITUACAO_PRAZO_LABEL: Record<string, string> = {
  ANTECIPADO: "Antecipado",
  NO_PRAZO: "No Prazo",
  ATRASADO: "Atrasado",
};
