import { useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, TrendingUp, Receipt, Factory, CheckCircle2, PackageCheck, Percent } from "lucide-react";
import { api } from "../lib/api";
import { formatarMoeda } from "../lib/format";
import { Card, PageHeader, Select } from "../components/ui";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const TOKEN = {
  brand500: "#2AA866",
  brand400: "#47C67D",
  success: "#2ECC71",
  info: "#3B82F6",
  danger: "#EF4444",
  gridLine: "rgba(255,255,255,0.08)",
  axisText: "#A7ADB6",
  tooltipBg: "#1C1F24",
  tooltipBorder: "rgba(255,255,255,0.14)",
};

const CORES_PRAZO = { antecipados: TOKEN.success, noPrazo: TOKEN.info, atrasados: TOKEN.danger };

interface Kpis {
  valorTotalVendido: number;
  valorTotalRecebido: number;
  ticketMedio: number;
  pedidosPorStatus: Record<string, number>;
  prazos: {
    total: number;
    antecipados: number;
    noPrazo: number;
    atrasados: number;
    percentualNoPrazo: number;
    percentualAtrasados: number;
    mediaDiasAtraso: number;
    mediaDiasAntecipacao: number;
  };
}

interface FaturamentoMes {
  mes: number;
  quantidade: number;
  quantidadeAcumulada: number;
  faturamento: number;
  faturamentoAcumulado: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  hero = false,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  hero?: boolean;
}) {
  return (
    <Card
      className={hero ? "relative overflow-hidden border-brand-800 p-6" : "p-5"}
      style={
        hero
          ? {
              backgroundImage:
                "radial-gradient(circle at 20% 0%, rgba(42,168,102,0.28), transparent 60%)",
            }
          : undefined
      }
    >
      <div
        className={
          hero
            ? "mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800/60 text-brand-300"
            : "mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text-secondary"
        }
      >
        <Icon size={18} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={hero ? "mt-1 text-3xl font-semibold tabular-nums text-text-primary" : "mt-1 text-2xl font-semibold tabular-nums text-text-primary"}>
        {value}
      </p>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-secondary">{title}</h2>
      {children}
    </Card>
  );
}

export function DashboardPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const { data } = await api.get<Kpis>("/dashboard/kpis");
      return data;
    },
  });

  const { data: faturamento } = useQuery({
    queryKey: ["dashboard-faturamento", ano],
    queryFn: async () => {
      const { data } = await api.get<FaturamentoMes[]>("/dashboard/faturamento-mensal", { params: { ano } });
      return data;
    },
  });

  const dadosMensais = faturamento?.map((f) => ({ ...f, nome: MESES[f.mes - 1] })) ?? [];

  const dadosPrazo = kpis
    ? [
        { nome: "Antecipados", valor: kpis.prazos.antecipados, cor: CORES_PRAZO.antecipados },
        { nome: "No Prazo", valor: kpis.prazos.noPrazo, cor: CORES_PRAZO.noPrazo },
        { nome: "Atrasados", valor: kpis.prazos.atrasados, cor: CORES_PRAZO.atrasados },
      ]
    : [];

  const tooltipStyle = {
    backgroundColor: TOKEN.tooltipBg,
    border: `1px solid ${TOKEN.tooltipBorder}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#F5F6F7",
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <Select className="w-32" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Valor Total Vendido" value={formatarMoeda(kpis?.valorTotalVendido ?? 0)} icon={TrendingUp} />
        <StatCard
          label="Valor Total Recebido (com desconto)"
          value={formatarMoeda(kpis?.valorTotalRecebido ?? 0)}
          icon={Wallet}
          hero
        />
        <StatCard label="Ticket Médio por Pedido" value={formatarMoeda(kpis?.ticketMedio ?? 0)} icon={Receipt} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Em Produção" value={String(kpis?.pedidosPorStatus.EM_PRODUCAO ?? 0)} icon={Factory} />
        <StatCard label="Finalizados" value={String(kpis?.pedidosPorStatus.FINALIZADO ?? 0)} icon={CheckCircle2} />
        <StatCard label="Entregues" value={String(kpis?.pedidosPorStatus.ENTREGUE ?? 0)} icon={PackageCheck} />
        <StatCard label="% Dentro do Prazo" value={`${kpis?.prazos.percentualNoPrazo ?? 0}%`} icon={Percent} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Evolução dos Pedidos (acumulado)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dadosMensais}>
              <defs>
                <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TOKEN.brand500} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={TOKEN.brand500} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={TOKEN.gridLine} vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="quantidadeAcumulada"
                name="Pedidos acumulados"
                stroke={TOKEN.brand500}
                strokeWidth={2}
                fill="url(#gradPedidos)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Faturamento por Mês">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke={TOKEN.gridLine} vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatarMoeda(Number(value))} />
              <Bar dataKey="faturamento" name="Faturamento" fill={TOKEN.brand500} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Faturamento Acumulado">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dadosMensais}>
              <defs>
                <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TOKEN.brand400} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={TOKEN.brand400} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={TOKEN.gridLine} vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TOKEN.axisText }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatarMoeda(Number(value))} />
              <Line
                type="monotone"
                dataKey="faturamentoAcumulado"
                name="Faturamento acumulado"
                stroke={TOKEN.brand400}
                strokeWidth={2}
                fill="url(#gradFaturamento)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição de Entregas por Prazo">
          {kpis && kpis.prazos.total === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center text-center">
              <Percent size={32} className="mb-2 text-text-tertiary" />
              <p className="text-sm text-text-secondary">Nenhum pedido finalizado ainda.</p>
              <p className="text-xs text-text-tertiary">A distribuição aparece após a primeira finalização.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={dadosPrazo}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={{ fill: TOKEN.axisText, fontSize: 12 }}
                  >
                    {dadosPrazo.map((entry) => (
                      <Cell key={entry.nome} fill={entry.cor} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-xs text-text-secondary">
                <span>Média atraso: {kpis?.prazos.mediaDiasAtraso ?? 0}d</span>
                <span>Média antecipação: {kpis?.prazos.mediaDiasAntecipacao ?? 0}d</span>
              </div>
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
