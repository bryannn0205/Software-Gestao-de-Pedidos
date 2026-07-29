# Componentes

> Parte de [`design-system.md`](design-system.md). Tokens de cor/tipografia/espaçamento referenciados aqui vêm de [`color-palette.md`](color-palette.md) e [`typography.md`](typography.md).

## 0. Escala de espaçamento e raio (base para todos os componentes)

**Espaçamento** (base 4px): `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Padding interno de card = `24`. Gap entre cards de um grid = `24`. Gap entre campos de formulário = `16`. Gap entre label e input = `6`.

**Raio de borda:**
| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | inputs, botões secundários, checkboxes |
| `radius-md` | 10px | botão primário padrão, badges retangulares |
| `radius-lg` | 16px | cards, modais |
| `radius-full` | 999px | pills (badges de status, botão primário de autenticação, avatar) |

## 1. Botões

| Variante | Estilo | Uso |
|---|---|---|
| **Primário** | fundo `brand-500`, texto `dark-text-primary`/branco, `radius-md`; hover `brand-600`; padding `10px 16px` | ação principal da tela (Salvar, Novo Pedido) |
| **Secundário** | fundo `surface-2`, borda `border-subtle`, texto `text-primary`, `radius-md` | ação alternativa (Cancelar, Exportar) |
| **Perigo** | fundo `danger`, texto branco, `radius-md` | ações destrutivas/irreversíveis |
| **Ghost/Texto** | sem fundo, texto `text-secondary`, sublinhado no hover | ações terciárias em linha de tabela (Editar, Ver) |
| **Ícone circular** | `radius-full`, fundo `surface-2`, 36–40px, ícone centrado | topbar (busca, notificação, atualizar) — padrão vindo da referência de dashboard |
| **Pill de autenticação** | fundo `brand-500` com leve gradiente para `brand-600`, `radius-full`, largura total do formulário | reservado exclusivamente a telas de Login/Recuperação de senha, para diferenciar o momento "auth" do restante do app (padrão vindo da referência de login) |

Estados obrigatórios em todo botão: `hover`, `active` (scale 0.98), `focus-visible` (anel de 2px em `brand-400` com 2px de offset), `disabled` (opacidade 0.5, `cursor: not-allowed`), `loading` (spinner inline substitui o label, botão mantém a largura).

## 2. Cards

- Fundo `bg-surface`, borda `1px solid border-subtle`, `radius-lg`, padding `24px`.
- Hover (quando clicável): borda vira `border-default` + leve elevação (`translateY(-1px)`), transição `150ms ease-out`.
- **Card "hero"** (glow): reservado a **um único** card por tela (ver [`design-system.md`](design-system.md) §3.5). Fundo com gradiente radial sutil de `brand-800`→`bg-surface`, ícone em badge quadrado `radius-md` no canto superior, número em `display`, variação percentual abaixo com ícone de seta + cor semântica (`success`/`danger`).
- **Card de KPI padrão** (sem glow): ícone em badge quadrado 32px `radius-md` fundo `surface-2`, label em `micro-label` acima ou abaixo do valor, valor em `h1`/`display`, delta opcional.

## 3. Formulários

Dois estilos coexistem, com contexto de uso bem definido — não misturar os dois no mesmo formulário:

### 3.1 Estilo "operacional" (padrão — Clientes, Produtos, Pedidos, Admin)
- Input com borda completa: fundo `surface-3`, borda `1px solid border-subtle`, `radius-sm`, padding `8px 12px`.
- Label **acima** do campo, `micro-label` style mas sem uppercase forçado quando o rótulo for uma frase longa (usar bom senso: rótulos de 1 palavra podem ir em caixa alta, frases não).
- Foco: borda `brand-500` + anel externo `2px brand-400` a 30% de opacidade.
- Erro: borda `danger`, mensagem em `small` cor `danger` abaixo do campo (nunca só a borda vermelha sem texto).
- Campos obrigatórios marcados com `*` depois do label — nunca só pela cor.

### 3.2 Estilo "auth" (exclusivo de Login/Recuperação de senha)
> **Revisado em 2026-07-24** a partir de um mockup próprio do produto (gerado para o EL-PACK, não uma referência de terceiros) — substitui a versão anterior "sem caixa/underline".
- Input com caixa: fundo `surface-3`, borda `1px solid border-subtle`, `radius-lg` (mais arredondado que o estilo operacional), padding `12px`, ícone leading (`lucide-react`, 16px, `text-tertiary`) indicando o tipo de campo (envelope para e-mail, cadeado para senha).
- Campo de senha tem ícone trailing de mostrar/ocultar (`Eye`/`EyeOff`), alterna `type="password"`/`text"` — nunca expõe a senha por padrão.
- Label em `micro-label` (uppercase) acima do campo — mantido da versão anterior.
- Foco: borda do container vira `brand-500` (`focus-within`), sem anel adicional.
- Linha abaixo dos campos com checkbox "Lembrar-me" (estende a sessão — ver `backend/src/modules/auth/auth.routes.ts`, parâmetro `lembrarMe`) e link "Esqueceu sua senha?" à direita, cor `brand-400`.
- "Esqueceu sua senha?" abre o componente `Modal` (ver §8) com uma mensagem informativa — **não** implica fluxo de e-mail automático, que não existe.
- Botão primário usa `radius-2xl` (mais arredondado que o botão padrão, mas não pill/`radius-full`) — variação exclusiva do contexto auth.
- Rodapé com copyright (`text-tertiary`, `small`) centrado abaixo do formulário.
- Usado **apenas** nas telas de autenticação — reforça a distinção "portal de entrada" vs. "aplicação operacional".

### 3.3 Regras comuns
- Nunca usar apenas `placeholder` como label (acessibilidade — leitores de tela e usuários que limpam o campo perdem o contexto).
- Combobox/autocomplete (cliente, produto no pedido): lista de sugestões em `bg-surface` elevado, item hover `surface-2`, borda `radius-md`, sombra `shadow-md`.
- Select nativo estilizado para casar com input (mesma altura, borda, radius).
- Nunca adicionar um campo/botão que sugira uma funcionalidade que não existe de fato (ex.: login social sem OAuth implementado) — ver `prompts/ui-agent.md`.

## 4. Tabelas

- Cabeçalho: `micro-label` style, texto `text-tertiary`, sem fundo diferenciado, `border-bottom: 1px solid border-subtle`.
- Linhas: sem zebra; separador `border-bottom: 1px solid border-subtle` (hairline) entre linhas, última linha sem borda.
- Hover de linha: fundo `surface-2`, transição `100ms`.
- Colunas numéricas/monetárias: alinhadas à direita, `tabular-nums`.
- Coluna de ação (Editar/Ver): sempre a última, alinhada à direita, estilo `ghost`.
- Paginação: alinhada ao centro abaixo da tabela, botões secundários + texto `small` "Página X de Y" — padrão já implementado, manter.

## 5. Sidebar

Padrão vindo diretamente do princípio observado na referência de dashboard (estrutura, não o conteúdo):

1. **Topo:** marca (nome do produto) + subtítulo pequeno.
2. **Grupos de navegação** com cabeçalho `micro-label` (ex.: "CADASTROS", "OPERAÇÃO", "ADMINISTRAÇÃO") — agrupar os módulos existentes:
   - *Operação:* Dashboard, Pedidos, Produção
   - *Cadastros:* Clientes, Produtos
   - *Administração:* Configurações
3. **Item de navegação:** ícone (20px) + label (`body`), padding `10px 12px`, `radius-md`. Estado ativo = fundo `brand-500` sólido (não outline) + texto branco — vindo diretamente do padrão "Overview" destacado na referência.
4. **Rodapé fixo:** avatar circular + nome do usuário + perfil (`small`, `text-secondary`) + ação de logout — reproduz o padrão "conta do usuário no fim da sidebar" da referência, sem copiar avatar/nome específicos.

## 6. Navbar / Topbar

> **Decisão (2026-07-24):** não existe uma barra de chrome persistente separada — o "topbar" é o próprio componente `PageHeader`, renderizado no topo do conteúdo de cada página (dentro da área rolável), não fixado acima da sidebar. Isso reproduz fielmente a referência original (o título "Dashboard" e os controles à direita estão na mesma linha, dentro da área de conteúdo).

- Título da página à esquerda (`h1`), via `PageHeader`.
- Área direita (`actions` do `PageHeader`): filtros/seletores da própria tela (ex.: seletor de ano no Dashboard) ou botão de ação principal (ex.: "Novo cliente"). Busca global e botões de ícone (atualizar, período) são adicionados quando a tela tiver essas ações — nenhuma tela ainda precisa disso.
- Sem sombra; separação do conteúdo por espaçamento, não por linha divisória pesada.

## 7. Badges de status

- Formato pill (`radius-full`), padding `2px 10px`, texto `small` peso 600.
- Fundo = cor semântica a ~15% de opacidade sobre a superfície; texto = cor semântica em tom sólido (ver [`color-palette.md`](color-palette.md) §4).
- Mapeamento de Etapa/Prazo é fixo — ver [`color-palette.md`](color-palette.md) §5. Nunca reatribuir cores por preferência estética pontual.

## 8. Modais

- Overlay: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(2px)`.
- Painel: `bg-surface`, `radius-lg`, padding `24px`, largura máxima 480–640px conforme conteúdo, sombra `shadow-md` mais pronunciada que cards (é o único elemento que "flutua" de verdade sobre a tela).
- Estrutura fixa: cabeçalho (título + botão fechar ícone, canto superior direito) → corpo → rodapé (ações alinhadas à direita, botão secundário antes do primário).
- Fecha com `Esc`, clique fora, ou botão fechar — sempre as três opções.

## 9. Estados vazios (empty states)

- Ícone outline 40–48px em `text-tertiary`, centrado.
- Mensagem curta em `body`, `text-secondary` (ex.: "Nenhum cliente cadastrado ainda").
- Ação primária opcional abaixo (ex.: botão "Novo cliente") quando o vazio for a primeira execução, não um filtro sem resultado.
- Distinguir "vazio por filtro" (mensagem: "Nenhum resultado para os filtros aplicados" + ação "Limpar filtros") de "vazio por ausência de dados" (mensagem de primeira execução).

## 10. Estados de carregamento (loading)

- **Preferência:** skeleton — blocos com o mesmo formato/tamanho do conteúdo final, fundo `surface-2` com animação de shimmer sutil (gradiente deslizante, `1.5s` loop).
- Tabelas: linhas-skeleton (3–5 linhas) em vez de spinner central.
- Botões: spinner inline substituindo o label, tamanho do botão inalterado (ver §1).
- Nunca bloquear a tela inteira com overlay + spinner quando parte do conteúdo já está disponível (ex.: manter sidebar/topbar interativos enquanto uma tabela carrega).

## 11. Microinterações e animação

Ver detalhamento de regras/exceções em [`ui-rules.md`](ui-rules.md) §Motion. Resumo:
- Duração padrão: `150–200ms`, easing `ease-out`.
- Hover de card/botão: leve elevação ou clareamento de borda, nunca mudança de tamanho brusca.
- Transição de cor (ex.: botão) sempre anima `background-color`/`border-color`, nunca `all`.
- Abertura de modal: fade + scale de 0.98→1, `200ms`.
- Respeitar `prefers-reduced-motion: reduce` (desabilitar shimmer/scale, manter apenas fade instantâneo).
