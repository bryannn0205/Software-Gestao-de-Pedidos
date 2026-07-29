# Sistema de Gestão de Pedidos — EL-PACK / EXTRUSAICK POLÍMEROS

Sistema web que substitui a planilha `Gestao_Pedidos_.xlsx`. Implementação da **Fase 1 (MVP — paridade com a planilha)**, conforme `Especificacao_Sistema_Gestao_Pedidos.md`.

O banco de dados nasce **vazio de dados de negócio** (nenhum cliente/produto/pedido é importado da planilha) — apenas o mínimo técnico para o sistema operar é semeado (perfis de acesso, 1 usuário administrador, listas de referência e parâmetros).

## Stack

- **Backend:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Query + Recharts

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou acessível via connection string)

## Configuração inicial

### 1. Backend

```bash
cd backend
npm install
```

Copie `.env.example` para `.env` e ajuste `DATABASE_URL` com suas credenciais do PostgreSQL:

```bash
cp .env.example .env
```

Crie o banco, aplique as migrations e rode o seed técnico (perfis, usuário admin, domínios, parâmetros):

```bash
npm run prisma:migrate
```

Isso cria o banco `gestao_pedidos`, aplica o schema e popula automaticamente:

- 5 perfis de acesso (Administrador, Vendas/Comercial, Produção, Financeiro, Leitura/Gerência)
- 1 usuário administrador inicial: **admin@elpack.local / TrocarSenha123!** (troque a senha no primeiro acesso, em Configurações → Usuários)
- Listas de domínio de referência (materiais, cores, micragens, formas de pagamento etc.)
- Parâmetros do sistema (prazo padrão de entrega = 7 dias, dados da empresa)

Suba o servidor:

```bash
npm run dev
```

API disponível em `http://localhost:3333`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Aplicação disponível em `http://localhost:5173`.

## Scripts úteis (backend)

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (hot reload) |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run prisma:migrate` | Aplica migrations pendentes + roda o seed |
| `npm run prisma:studio` | Interface visual do banco de dados |
| `npm run prisma:seed` | Roda apenas o seed (idempotente) |

## Numeração de pedidos e prazo padrão

O "número inicial do pedido" e o "prazo padrão de entrega" (7 dias, conforme planilha) são parâmetros configuráveis em **Configurações → Parâmetros**, não valores fixos no código.

## Escopo desta entrega (Fase 1)

Implementado: Clientes, Produtos, Pedidos (multi-item, cálculo automático incl. venda por Kg, desconto livre, numeração sequencial atômica), Produção (fila por etapa + histórico), Finalização com cálculo de situação de prazo, Dashboard com os KPIs da planilha (com a correção do cálculo de faturamento mensal — usa o valor do pedido, não o percentual de desconto), Autenticação/RBAC por perfil e Auditoria.

Deixado para fases futuras (conforme roadmap da especificação, §9): Kanban com drag-and-drop, validação fiscal/CEP, múltiplos endereços por cliente, impressão/PDF, contas a receber, integração fiscal, notificações.
