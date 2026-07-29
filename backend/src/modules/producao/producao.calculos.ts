// Regra de cálculo de situação de prazo, isolada em funções puras (sem acesso a
// banco) para poder ser testada diretamente — ver producao.calculos.test.ts.

export type SituacaoPrazo = "ANTECIPADO" | "NO_PRAZO" | "ATRASADO";

// Compara só a data (ano/mês/dia), ignorando hora, para não gerar diferença de
// prazo por causa de horário/fuso — ambas as datas são normalizadas para meia-noite UTC.
export function calcularDiasDiferenca(dataFinalizacao: Date, dataEntregaPrevista: Date): number {
  const finalizacaoUTC = Date.UTC(
    dataFinalizacao.getFullYear(),
    dataFinalizacao.getMonth(),
    dataFinalizacao.getDate(),
  );
  const previstaUTC = Date.UTC(
    dataEntregaPrevista.getFullYear(),
    dataEntregaPrevista.getMonth(),
    dataEntregaPrevista.getDate(),
  );
  return Math.round((finalizacaoUTC - previstaUTC) / 86_400_000);
}

// Negativo = antecipado, zero = no prazo, positivo = atrasado (mesma convenção da planilha original).
export function calcularSituacaoPrazo(diasDiferenca: number): SituacaoPrazo {
  if (diasDiferenca < 0) return "ANTECIPADO";
  if (diasDiferenca === 0) return "NO_PRAZO";
  return "ATRASADO";
}
