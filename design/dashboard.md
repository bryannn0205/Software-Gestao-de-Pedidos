# Dashboard — Padrões Visuais

> Parte de [`design-system.md`](design-system.md). Complementa [`components.md`](components.md) §2 (Cards) com regras específicas para a tela de Dashboard e qualquer outra tela orientada a indicadores.

Este documento descreve **padrões de layout e leitura de dados**, aplicáveis aos KPIs e gráficos já definidos na especificação funcional (§8 do documento de especificação: Valor Total Vendido, Valor Total Recebido, Ticket Médio, Pedidos por Status, Faturamento por Mês, Prazos). Não introduz nenhum indicador novo — apenas como exibi-los.

## 1. Estrutura de página

1. **Linha de KPIs primários** (topo): 3–4 cards em grid horizontal, altura igual, um deles pode ser o card "hero" com glow (ver [`components.md`](components.md) §2) — reservado ao indicador mais importante da tela (ex.: Valor Total Recebido).
2. **Linha de KPIs secundários**: cards menores e mais numerosos (ex.: contagem por status), sem glow, ícone+label+número.
3. **Grid de gráficos**: 2 colunas em desktop (≥1024px), 1 coluna em telas menores. Cada gráfico dentro de um card padrão com título `h2` no topo do card.
4. **Filtros globais** (quando existirem — ano, período, cliente): alinhados à direita do título da página, nunca ocupando uma linha própria isolada.

## 2. Cards de KPI

| Elemento | Regra |
|---|---|
| Ícone | badge quadrado `radius-md`, 32–40px, cor de fundo `surface-2` (ou `brand-800` no card hero) |
| Label | `micro-label`, acima do valor, descreve o indicador sem abreviar de forma ambígua |
| Valor | `display` (hero) ou `h1` (padrão), sempre `tabular-nums`, moeda/formato pt-BR |
| Delta/variação | opcional — ícone seta (▲/▼) + percentual, cor `success` (queda de atraso, aumento de receita) ou `danger` conforme semântica **do negócio**, não da direção do número (ex.: aumento de "% atrasados" é `danger`, não `success`, mesmo sendo um número que "subiu") |

## 3. Gráfico de linha (evolução / acumulado)

- Linha em `brand-500`, espessura 2px.
- Área sob a linha com gradiente vertical: `brand-500` a ~25% de opacidade no topo → transparente na base — princípio extraído da referência (área preenchida sob a curva), sem copiar os valores/dados exibidos nela.
- Grid horizontal sutil (`border-subtle`), sem grid vertical.
- Eixo Y com poucos ticks (4–5), formatado de forma abreviada quando o valor for grande (ex.: `150K`) — mantendo o valor completo no tooltip.
- Tooltip: card flutuante `bg-surface` elevado, mostra o valor completo formatado em pt-BR + o mês/data.
- **Ponto de comparação (opcional):** quando fizer sentido comparar dois períodos (ex.: mês atual vs. mesmo mês ano anterior), usar uma linha vertical pontilhada `border-default` com dois marcadores e um tooltip curto por marcador — padrão inspirado na referência, usar com moderação (não é o padrão default de todo gráfico).

## 4. Gráfico de barras (faturamento por mês)

- Barras em `brand-500`, `radius-sm` no topo apenas.
- Espaçamento entre barras ≈ 40% da largura da barra.
- Hover: barra clareia para `brand-400` + tooltip.
- Eixo X sempre com os 12 meses abreviados em pt-BR (Jan–Dez), mesmo com valor zero — nunca omitir meses sem dado.

## 5. Gráfico de rosca/pizza (distribuição — ex. entregas por prazo, breakdown de faturamento)

- Usar no máximo 4–5 segmentos; além disso, agrupar em "Outros".
- Cores: sempre as cores semânticas do domínio representado quando existirem (ex.: distribuição de prazo usa `success`/`info`/`danger` da §5 de [`color-palette.md`](color-palette.md)); para domínios sem semântica própria (ex.: breakdown por forma de pagamento), usar a sequência categórica de [`color-palette.md`](color-palette.md) §6.
- Rótulo de percentual dentro ou junto ao segmento; legenda abaixo do gráfico, nunca só cor sem texto.
- Buraco central (donut) preferível a pizza cheia — mais legível em fundo escuro e permite exibir um número-resumo no centro quando fizer sentido (ex.: total).

## 6. Responsividade

- Abaixo de 1024px: grid de gráficos vira 1 coluna, cards de KPI quebram para 2 por linha.
- Abaixo de 640px: cards de KPI 1 por linha; gráficos mantêm altura mínima de 220px para não comprimir a leitura.

## 7. O que evitar

- Mais de um card "hero" com glow por tela (dilui a hierarquia).
- Gráficos sem título ou sem eixo legível "porque o card já diz o que é" — sempre manter título do gráfico redundante com o card, ajuda escaneabilidade.
- Paleta de cores diferente da oficial em qualquer gráfico novo.
- Números sem separador de milhar/decimal pt-BR em eixo ou tooltip.
