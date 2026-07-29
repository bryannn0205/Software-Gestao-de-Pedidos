-- Impede CNPJ/CPF duplicado entre clientes (achado da auditoria)
CREATE UNIQUE INDEX "clientes_cnpj_cpf_key" ON "clientes"("cnpj_cpf");
