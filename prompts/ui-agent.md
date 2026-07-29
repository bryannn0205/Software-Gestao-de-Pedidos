# Instruções para alterações de interface (UI Agent)

> Este arquivo é lido **antes** de qualquer alteração visual no projeto EL-PACK Gestão de Pedidos — por Claude Code ou qualquer outro agente/dev. Ele não substitui os documentos de design; é o checklist de processo que aponta para eles.

## Fonte oficial de identidade visual

A identidade visual do projeto está documentada em `/design`:

1. [`design/design-system.md`](../design/design-system.md) — visão geral, personalidade de marca, princípios, e **os limites do que pode ser reaproveitado das referências de design** (leitura obrigatória antes das demais).
2. [`design/color-palette.md`](../design/color-palette.md) — todos os tokens de cor (marca, neutros dark/light, semânticos, gráficos).
3. [`design/typography.md`](../design/typography.md) — fonte, escala, pesos, regras de caixa alta.
4. [`design/components.md`](../design/components.md) — especificação de botões, cards, formulários, tabelas, sidebar, navbar, badges, modais, empty/loading states.
5. [`design/dashboard.md`](../design/dashboard.md) — padrões específicos de KPIs e gráficos.
6. [`design/ui-rules.md`](../design/ui-rules.md) — checklist de acessibilidade, motion, formato pt-BR, consistência.

**Nenhuma decisão visual nova deve ser tomada sem checar se já existe resposta em um desses arquivos.**

## Antes de tocar em qualquer interface: checklist obrigatório

1. **Ler** `design/design-system.md` §3 (princípios gerais) e a seção de `design/components.md` relevante ao componente que será tocado.
2. **Verificar reuso**: existe um componente equivalente em `frontend/src/components/`? Reaproveitar antes de criar um novo.
3. **Verificar tokens**: toda cor/espaçamento/raio usado já está definido em `design/color-palette.md` ou `design/components.md` §0? Se não, propor a adição ao documento antes de usar um valor solto no código.
4. **Verificar RBAC**: a mudança afeta navegação ou visibilidade de ação? Confirmar que a permissão correspondente (`temPermissao`, `ProtectedRoute`) já cobre o caso — nunca esconder algo "só visualmente" sem o guard de permissão real.
5. **Verificar pt-BR**: qualquer número/data nova passa pelos helpers de `frontend/src/lib/format.ts`, nunca formatação manual.
6. **Verificar acessibilidade**: contraste, label associado a input, foco visível, `aria-label` em botão de ícone — ver `design/ui-rules.md` §3.
7. **Verificar os dois temas**: se o projeto já suportar dark/light no momento da mudança, testar visualmente nos dois antes de finalizar.

## Regras inegociáveis (hard constraints)

- **Não introduzir cores fora da paleta** definida em `design/color-palette.md`. Se uma cor nova parecer necessária, isso é uma proposta de mudança de documento, não uma decisão ad-hoc dentro de um componente.
- **Não copiar elementos exclusivos das referências originais** (`/references`): nomes de marca, textos/copy exatos, a fotografia usada na referência de login, a fonte serifada do título de login. Ver limites detalhados em `design/design-system.md` §1.
- **Não misturar o estilo de formulário "auth" (underline) com o estilo "operacional" (caixa completa)** dentro da mesma tela — são contextos visuais deliberadamente distintos (`design/components.md` §3).
- **Não usar mais de um card "hero" com glow por tela** (`design/components.md` §2, `design/dashboard.md` §7).
- **Não mudar o mapeamento de cor semântica de Etapa/Situação de Prazo** (`design/color-palette.md` §5) sem validar com o usuário — é uma convenção de negócio, não só estética.
- **Não remover funcionalidade existente para "simplificar visualmente"** — qualquer refatoração de UI preserva 100% do comportamento funcional já implementado, a menos que o usuário peça explicitamente a remoção.
- **Não alterar múltiplas telas de uma vez sem avisar antes** — seguindo a diretriz geral do projeto, explicar rapidamente o que será modificado antes de tocar em vários arquivos.

## Quando a especificação de design não cobrir um caso

Se surgir um componente ou situação visual não descrita em `/design`:

1. Resolver por analogia com o padrão mais próximo já documentado (não inventar um estilo isolado).
2. Registrar a decisão no documento de design apropriado (atualizar o `.md`, não deixar a regra só implícita no código).
3. Se a decisão for ambígua ou afetar identidade de marca (nova cor, novo padrão de layout estrutural), perguntar ao usuário antes de implementar — não assumir.

## Migração do estado atual

O frontend implementado na Fase 1 (MVP) usa um tema claro genérico (Tailwind slate/blue), anterior a esta identidade visual. Este documento **não autoriza automaticamente** uma migração completa da UI existente — a migração é um trabalho de UI a ser planejado e aprovado como tarefa própria. Até que isso aconteça, novas telas isoladas não devem ser construídas com os novos tokens enquanto o restante permanece no tema antigo sem que isso seja uma decisão explícita e combinada com o usuário.
