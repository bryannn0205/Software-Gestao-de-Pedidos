# Tipografia

> Parte de [`design-system.md`](design-system.md).

## 1. Família tipográfica

**Sans-serif geométrica única** para toda a interface (dashboard, formulários, tabelas, autenticação):

```
font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
```

**Não usar** fonte serifada para nenhum título, mesmo em telas de autenticação. Uma das referências usa serifa itálica no título "Login" como assinatura visual exclusiva daquela peça — não faz parte da nossa identidade. Manter uma única família em todo o produto reforça consistência num sistema denso em dados.

Números (valores monetários, quantidades, IDs) devem preferencialmente usar a variante tabular quando disponível:

```css
font-variant-numeric: tabular-nums;
```

Isso evita que colunas de números "dancem" em tabelas e KPIs ao trocar de valor.

## 2. Escala tipográfica

| Token | Tamanho / Altura de linha | Peso | Uso |
|---|---|---|---|
| `display` | 32px / 40px | 600 (semibold) | Valor de KPI hero, número de destaque único por tela |
| `h1` | 28px / 36px | 600 | Título de página (`PageHeader`) |
| `h2` | 20px / 28px | 600 | Título de card/seção |
| `h3` | 16px / 24px | 600 | Subtítulo, cabeçalho de bloco menor |
| `body-lg` | 16px / 24px | 400 | Texto de leitura longa (raramente usado neste produto) |
| `body` | 14px / 20px | 400 | Texto padrão de UI — tabelas, formulários, botões |
| `small` | 13px / 18px | 400 | Texto de apoio, metadados, timestamps |
| `micro-label` | 11px / 16px | 600 | Rótulos em caixa alta (ver seção 3) |

Regra geral: **um valor numérico de KPI nunca é menor que `h2`**; ele é sempre o elemento mais proeminente do card onde aparece.

## 3. Uso de maiúsculas e tracking

Padrão observado nas referências (rótulos de seção da sidebar, labels de formulário) e adotado como convenção própria:

```css
text-transform: uppercase;
letter-spacing: 0.06em;
font-size: 11px;
font-weight: 600;
color: var(--text-tertiary);
```

Aplicar em: cabeçalhos de grupo de sidebar (ex.: "Cadastros", "Operação", "Administração"), rótulos de campo em formulários compactos, cabeçalhos de coluna de tabela.

**Não aplicar** em: títulos de página, texto de botão, texto corrido, mensagens de erro/sucesso — caixa alta nesses contextos reduz legibilidade e soa "gritado".

## 4. Pesos disponíveis

Usar apenas dois pesos em toda a interface: **400 (regular)** para texto corrido e **600 (semibold)** para ênfase/títulos. Não introduzir 300, 500 ou 700 — reduz inconsistência visual e mantém a fonte leve para performance.

## 5. Texto em português (pt-BR)

- Nunca truncar palavras com abreviações não padronizadas; preferir `text-overflow: ellipsis` com `title` (tooltip) mostrando o valor completo.
- Números seguem sempre formatação pt-BR (`1.234,56`, não `1,234.56`) — já implementado via `Intl.NumberFormat("pt-BR", ...)` no frontend; qualquer novo componente numérico deve reutilizar esse helper (`src/lib/format.ts`), nunca formatar manualmente.
- Datas em `dd/mm/aaaa`. Ver [`ui-rules.md`](ui-rules.md) §pt-BR.
