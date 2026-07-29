-- CreateEnum
CREATE TYPE "TipoVenda" AS ENUM ('UNIDADE', 'KG');

-- CreateEnum
CREATE TYPE "EtapaPedido" AS ENUM ('EM_PRODUCAO', 'FINALIZADO', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "SituacaoPrazo" AS ENUM ('ANTECIPADO', 'NO_PRAZO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "TipoDominio" AS ENUM ('MATERIAL', 'COR', 'MEDIDA', 'MICRAGEM', 'TIPO_RESIDUO', 'FORMA_PAGAMENTO');

-- CreateTable
CREATE TABLE "perfis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "permissoes" JSONB NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj_cpf" TEXT NOT NULL,
    "inscricao_estadual" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cep" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" SERIAL NOT NULL,
    "linha" TEXT,
    "material" TEXT NOT NULL,
    "medida" TEXT NOT NULL,
    "micragem" TEXT,
    "cor_padrao" TEXT,
    "valor_unitario" DECIMAL(12,2) NOT NULL,
    "tipo_venda" "TipoVenda" NOT NULL,
    "peso_kg" DECIMAL(10,3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL,
    "data_entrega_prevista" TIMESTAMP(3) NOT NULL,
    "data_finalizacao" TIMESTAMP(3),
    "etapa" "EtapaPedido" NOT NULL DEFAULT 'EM_PRODUCAO',
    "forma_pagamento" TEXT NOT NULL,
    "desconto_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_com_desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "situacao_prazo" "SituacaoPrazo",
    "dias_diferenca" INTEGER,
    "usuario_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "cor" TEXT,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "unidade" TEXT NOT NULL,
    "valor_unitario" DECIMAL(12,4) NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_status_hist" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "etapa_anterior" "EtapaPedido",
    "etapa_nova" "EtapaPedido" NOT NULL,
    "usuario_id" TEXT,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_status_hist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dominios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDominio" NOT NULL,
    "valor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dominios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "parametros_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "sequencia_pedido" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proximo_numero" INTEGER NOT NULL,

    CONSTRAINT "sequencia_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "dominios_tipo_valor_key" ON "dominios"("tipo", "valor");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_status_hist" ADD CONSTRAINT "pedido_status_hist_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_status_hist" ADD CONSTRAINT "pedido_status_hist_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
