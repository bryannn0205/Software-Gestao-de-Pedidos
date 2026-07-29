# Paleta de Cores

> Parte de [`design-system.md`](design-system.md). Todos os valores aqui são **tokens** — a UI nunca deve usar um hex fora desta tabela.

## 1. Verde de marca (`brand`)

Extraído do princípio "acento verde sobre fundo escuro" das referências, ajustado para um tom mais corporativo (menos neon) e com contraste validado em fundo escuro e claro.

| Token | Hex | Uso |
|---|---|---|
| `brand-50` | `#EEFBF2` | fundo de destaque muito sutil (tema claro) |
| `brand-100` | `#D3F3DE` | fundo de badge "sucesso" leve |
| `brand-200` | `#A6E7BE` | hover de fundo leve |
| `brand-300` | `#74D89C` | ícones secundários |
| `brand-400` | `#47C67D` | hover de elementos primários |
| `brand-500` | `#2AA866` | **cor primária de marca** — botão primário, links de ação, foco |
| `brand-600` | `#1F8A54` | hover/active do botão primário |
| `brand-700` | `#1B6F45` | texto sobre `brand-100` (contraste AA) |
| `brand-800` | `#185A39` | glow/gradiente de card hero (camada escura) |
| `brand-900` | `#123F28` | fundo de glow em tema dark (baixa opacidade) |

**Regra:** `brand-500` é a única cor "de marca" usada fora de contexto semântico. Nunca usar tons de verde fora desta escala para decoração.

## 2. Neutros — tema Dark (padrão)

| Token | Hex | Uso |
|---|---|---|
| `dark-bg-canvas` | `#0B0C0E` | fundo da página |
| `dark-bg-surface` | `#14161A` | cards, sidebar |
| `dark-bg-surface-2` | `#1C1F24` | cards aninhados, hover de linha de tabela |
| `dark-bg-surface-3` | `#242830` | inputs, elementos interativos em repouso |
| `dark-border-subtle` | `rgba(255,255,255,0.08)` | borda padrão de card |
| `dark-border-default` | `rgba(255,255,255,0.14)` | borda em hover/focus, divisores |
| `dark-text-primary` | `#F5F6F7` | texto principal, números de KPI |
| `dark-text-secondary` | `#A7ADB6` | labels, texto de apoio |
| `dark-text-tertiary` | `#6E7480` | placeholders, texto desabilitado |

## 3. Neutros — tema Light (alternativa de acessibilidade)

| Token | Hex | Uso |
|---|---|---|
| `light-bg-canvas` | `#F7F8FA` | fundo da página |
| `light-bg-surface` | `#FFFFFF` | cards, sidebar |
| `light-bg-surface-2` | `#F0F2F5` | hover de linha de tabela |
| `light-border-subtle` | `#E4E7EC` | borda padrão de card |
| `light-border-default` | `#D3D8E0` | borda em hover/focus |
| `light-text-primary` | `#14161A` | texto principal |
| `light-text-secondary` | `#5B6470` | labels, texto de apoio |
| `light-text-tertiary` | `#94999E` | placeholders |

Os dois temas compartilham os mesmos tokens semânticos e de marca (seções 1 e 4) — só os neutros mudam.

## 4. Cores semânticas

| Token | Dark | Light | Uso |
|---|---|---|---|
| `success` | `#2ECC71` | `#1F8A54` | Entregue, Antecipado, valores positivos |
| `info` | `#3B82F6` | `#2563EB` | Finalizado, No Prazo, informativo neutro |
| `warning` | `#F5A524` | `#B45309` | Em Produção, atenção |
| `danger` | `#EF4444` | `#DC2626` | Atrasado, erro, exclusão |

Cada cor semântica tem uma variante "fundo fraco" (10–15% de opacidade sobre a superfície) para badges e uma variante "texto/ícone" de contraste total — nunca usar a cor sólida como fundo de texto longo.

## 5. Mapeamento oficial de status (já implementado no sistema)

| Domínio | Valor | Token semântico |
|---|---|---|
| Etapa do Pedido | `Em Produção` | `warning` |
| Etapa do Pedido | `Finalizado` | `info` |
| Etapa do Pedido | `Entregue (OK)` | `success` |
| Situação de Prazo | `Antecipado` | `success` |
| Situação de Prazo | `No Prazo` | `info` |
| Situação de Prazo | `Atrasado` | `danger` |

Este mapeamento já existe no frontend atual (badges coloridos) e deve ser preservado ao migrar para os novos tokens — mudar apenas o valor hex por trás do token, nunca a lógica de qual status recebe qual semântica.

## 6. Gráficos (séries categóricas)

Para gráficos com múltiplas séries (ex.: breakdown de faturamento), usar — nesta ordem — antes de repetir tons:

```
brand-500, info, warning, brand-300, danger, dark-text-tertiary
```

Nunca usar paleta "arco-íris" arbitrária. Ver detalhamento em [`dashboard.md`](dashboard.md).

## 7. Contraste (acessibilidade)

- Texto normal sobre `dark-bg-canvas`/`dark-bg-surface`: mínimo **4.5:1** (`dark-text-primary` e `dark-text-secondary` já validados).
- `dark-text-tertiary` só para elementos não essenciais (placeholder, timestamp secundário) — nunca para texto de decisão (valores, ações).
- Nunca usar `brand-500` como cor de texto sobre `dark-bg-canvas` para texto longo (contraste insuficiente) — apenas para texto curto/bold (links, valores em destaque) ou ícones ≥ 20px.
