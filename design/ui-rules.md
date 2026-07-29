# Regras Operacionais de UI

> Parte de [`design-system.md`](design-system.md). Este arquivo é a lista de verificação prática — o que fazer e o que não fazer — para qualquer implementação visual. Ver também o checklist de processo em [`../prompts/ui-agent.md`](../prompts/ui-agent.md).

## 1. Tokens — regra de ouro

- **Nunca** escrever um valor de cor, espaçamento ou raio "solto" (hex direto, `px` arbitrário) em um componente novo. Sempre referenciar o token equivalente em [`color-palette.md`](color-palette.md), [`typography.md`](typography.md) ou [`components.md`](components.md) §0.
- Se um valor necessário não existe na escala, **isso é um sinal para propor a adição do token ao documento**, não para inventar um valor pontual no código.

## 2. pt-BR (formato de dados) — obrigatório em toda tela

- Moeda: `R$ 1.234,56` via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` (já existe em `frontend/src/lib/format.ts` como `formatarMoeda`).
- Data: `dd/mm/aaaa` via `formatarData` (mesmo arquivo).
- Nunca formatar número/data manualmente com template string — sempre pelos helpers centralizados, para não haver dois formatos coexistindo no mesmo produto.

## 3. Acessibilidade (obrigatório, não opcional)

- Contraste mínimo AA (4.5:1) para texto normal, 3:1 para texto grande (≥24px/bold ≥19px) — ver validação de tokens em [`color-palette.md`](color-palette.md) §7.
- **Nunca comunicar estado só por cor.** Toda badge de status tem texto; todo ícone de tendência (▲/▼) acompanha o número, não substitui.
- Todo campo de formulário tem `<label>` associado (nunca só `placeholder`).
- Todo elemento interativo tem estado de foco visível (`focus-visible`), especialmente relevante em tema dark onde o contraste do foco precisa ser desenhado explicitamente (não depender do outline padrão do navegador, que costuma ser invisível em fundo escuro).
- Área mínima de toque/clique: 40×40px para botões de ícone.
- Botões de ícone sem texto visível precisam de `aria-label` descritivo.
- Respeitar `prefers-reduced-motion: reduce` — desabilitar shimmer, scale e transições decorativas quando o usuário sinalizar preferência por menos movimento.
- Testar toda tela nova nos dois temas (dark e light) antes de considerar concluída — não assumir que o tema dark "resolve" contraste que falharia no claro, e vice-versa.

## 4. Motion (microinterações)

| Interação | Duração | Easing | Propriedade animada |
|---|---|---|---|
| Hover de botão/card | 150ms | ease-out | `background-color`, `border-color`, `transform` |
| Abertura de modal | 200ms | ease-out | `opacity`, `transform: scale(0.98→1)` |
| Skeleton shimmer | 1500ms loop | linear | `background-position` |
| Troca de aba/tab | 120ms | ease-out | `opacity` (conteúdo), `transform` (indicador ativo) |

Nunca animar `all` (custo de performance e comportamento imprevisível). Nunca usar durações acima de 300ms para interações de UI comuns — acima disso, a interface parece "lenta", não "elegante".

## 5. Consistência de componentes

- Antes de criar um componente novo, procurar em [`components.md`](components.md) se o padrão já existe. Duplicar levemente-diferente é o principal gerador de inconsistência visual ao longo do tempo.
- Todo componente reutilizável fica em `frontend/src/components/`; nada de estilo duplicado copiado entre páginas.
- Um único botão primário por tela/formulário — se parecer necessário um segundo botão com o mesmo peso visual, revisar se a tela não deveria ser dividida em passos.

## 6. RBAC e UI

- Nenhuma regra visual deste documento substitui o controle de permissão já existente (`temPermissao`, `ProtectedRoute`). Um item de navegação/ação some da UI quando o perfil não tem a permissão — isso é lógica de produto, não decisão de estilo, e não deve ser "escondido só visualmente" (ex.: `display:none` sem também bloquear no backend) — reforça o que já está implementado em `backend/src/shared/auth.ts`.

## 7. O que este documento explicitamente não cobre

- Conteúdo/copy dos textos da interface (fica a critério de cada tela, seguindo apenas o tom "profissional e direto" definido em [`design-system.md`](design-system.md) §2).
- Estrutura de dados/API — este é um documento de UI, não de arquitetura backend.
- Prazo/ordem de migração do tema atual (claro, genérico) para os novos tokens — é uma decisão de produto a ser tomada separadamente, não uma regra de estilo.
