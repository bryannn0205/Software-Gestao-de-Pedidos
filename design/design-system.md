# Design System — EL-PACK Gestão de Pedidos

> **Status:** fonte oficial de identidade visual do projeto.
> Qualquer alteração de interface (nova tela, novo componente, refatoração visual) deve consultar este documento e os demais arquivos desta pasta **antes** de escrever código. Ver também [`prompts/ui-agent.md`](../prompts/ui-agent.md).

## 1. Origem e limites de uso

Esta identidade visual foi construída a partir da **análise de princípios** de duas referências de design fornecidas em `/references` (um dashboard analítico dark com acento verde e uma tela de login dark com imagem full-bleed).

**O que foi extraído (permitido):** paleta de cores, tipografia, espaçamento, hierarquia visual, estilo de cards/botões/formulários/tabelas, padrões de sidebar/navbar, comportamento de estados (loading/vazio/hover).

**O que NÃO foi e NÃO deve ser reaproveitado (proibido):**
- Nome/marca das referências (ex.: "InsightX") ou qualquer logotipo.
- Textos, rótulos ou copy exatos vistos nas imagens.
- A fotografia usada na tela de login das referências.
- Fonte serifada usada no título "Login" da referência (é um traço exclusivo daquela peça, não do nosso sistema).
- Qualquer elemento gráfico exclusivo (ícones customizados, ilustrações).

Este documento define uma identidade **própria**, apenas inspirada nos princípios de composição observados.

> **Nota (2026-07-24):** uma terceira imagem foi adicionada a `/references` — um mockup do próprio EL-PACK gerado por IA a pedido do usuário (já usando o nome/marca do nosso produto). Esse caso é diferente: não é uma referência de terceiro a ser abstraída, é uma proposta de layout para o nosso produto, então seu conteúdo (nome, tagline, estrutura de tela) pode ser seguido mais de perto. Mesmo assim, elementos que impliquem funcionalidade inexistente (ex.: login social, recuperação de senha por e-mail) não são implementados sem validação explícita — ver decisão registrada em `components.md` §3.2 e o histórico da conversa.

## 2. Personalidade da marca

- **Contexto:** ERP interno de manufatura (pedidos, produção, financeiro) para a EL-PACK/EXTRUSAICK POLÍMEROS — uso diário, intensivo, por perfis variados (vendas, produção, financeiro, gerência).
- **Tom visual:** profissional, confiável, denso em dados mas nunca poluído. Sóbrio, não "SaaS consumer". Prioriza legibilidade e velocidade de leitura de números sobre decoração.
- **Tema padrão:** **dark** (inspirado nas referências), com **tema claro** como alternativa de acessibilidade — ver [`color-palette.md`](color-palette.md). Os dois temas usam os mesmos tokens semânticos, nunca cores "soltas".
- **Acento de marca:** verde (herdado das referências), aplicado com moderação — reservado para ações primárias, destaques de KPI e estados de sucesso. Nunca usado em grandes áreas de fundo.

## 3. Princípios gerais (aplicam-se a toda tela nova)

1. **Hierarquia por peso e tamanho, não por cor.** Números grandes e em negrito comunicam o dado principal; cor é reservada para status/semântica.
2. **Densidade controlada.** Espaçamento generoso entre blocos (24–32px), mas compacto dentro de tabelas/formulários (ver [`typography.md`](typography.md) e [`ui-rules.md`](ui-rules.md)).
3. **Bordas sutis > sombras pesadas.** Em fundo escuro, elevação vem de `border` translúcida + leve variação de brilho de superfície, não de `box-shadow` escuro tradicional.
4. **Estado sempre duplamente codificado.** Nunca só cor: badges de status combinam cor + texto (e ícone quando fizer sentido) — requisito de acessibilidade.
5. **Um único elemento de destaque por tela.** No máximo um card "hero" com glow/gradiente por página (ex.: um KPI principal no Dashboard). Uso indiscriminado de glow anula o efeito de destaque.
6. **Consistência de dados pt-BR.** Moeda `R$`, datas `dd/mm/aaaa`, decimais com vírgula — já é requisito funcional (RNF08 da especificação) e também é regra visual: todo número em tela segue esse formato, sem exceção.
7. **Reuso antes de criação.** Antes de desenhar um componente novo, verificar se um padrão equivalente já existe em [`components.md`](components.md).

## 4. Mapa dos documentos

| Arquivo | Conteúdo |
|---|---|
| [`color-palette.md`](color-palette.md) | Tokens de cor (marca, neutros, semânticos), tema dark e light |
| [`typography.md`](typography.md) | Família tipográfica, escala, pesos, uso de maiúsculas/tracking |
| [`components.md`](components.md) | Botões, cards, formulários, tabelas, sidebar, navbar, modais, badges |
| [`dashboard.md`](dashboard.md) | Padrões específicos de KPIs, gráficos e layout de dashboard |
| [`ui-rules.md`](ui-rules.md) | Regras operacionais (o que fazer/não fazer), acessibilidade, motion |
| [`../prompts/ui-agent.md`](../prompts/ui-agent.md) | Checklist obrigatório antes de qualquer alteração visual |

## 5. Relação com a implementação atual

> **Atualizado em 2026-07-24.** Status: Login, shell (sidebar) e Dashboard têm layout e estrutura totalmente migrados para a identidade dark. As demais telas (Clientes, Produtos, Pedidos, Produção, Configurações) já usam os tokens de cor corretos em todo o seu conteúdo (nenhuma cor "solta" slate/blue remanescente) — mas sua **estrutura/layout** (composição da tela, hierarquia visual, padrões de card/cabeçalho mais elaborados) ainda não foi revisada tela a tela; isso é feito de forma incremental, uma tela por vez, a pedido do usuário.

Ordem de migração completa (estrutura + cor), conforme decidido com o usuário: **1. Login** (concluído) → **2. Dashboard** (concluído) → próximas telas a definir.

> **Decisão do usuário (2026-07-24):** manter as demais telas (Clientes, Produtos, Pedidos, Produção, Configurações) no estado atual — cor consistente com os tokens, estrutura/layout inalterada — por tempo indeterminado, sem redesenho estrutural agendado. Não iniciar migração estrutural de nenhuma tela adicional sem pedido explícito do usuário.
