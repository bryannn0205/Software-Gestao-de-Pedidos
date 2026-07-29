-- CreateIndex
CREATE INDEX "audit_log_usuario_id_idx" ON "audit_log"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_log_entidade_entidade_id_idx" ON "audit_log"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "enderecos_cliente_id_idx" ON "enderecos"("cliente_id");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_produto_id_idx" ON "itens_pedido"("produto_id");

-- CreateIndex
CREATE INDEX "pedido_status_hist_pedido_id_idx" ON "pedido_status_hist"("pedido_id");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_usuario_id_idx" ON "pedidos"("usuario_id");

-- CreateIndex
CREATE INDEX "pedidos_data_pedido_idx" ON "pedidos"("data_pedido");

-- CreateIndex
CREATE INDEX "pedidos_etapa_idx" ON "pedidos"("etapa");

-- CreateIndex
CREATE INDEX "usuarios_perfil_id_idx" ON "usuarios"("perfil_id");
