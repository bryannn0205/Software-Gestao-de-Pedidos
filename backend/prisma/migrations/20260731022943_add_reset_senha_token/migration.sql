-- CreateTable
CREATE TABLE "reset_senha_tokens" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_senha_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reset_senha_tokens_token_hash_key" ON "reset_senha_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "reset_senha_tokens_usuario_id_idx" ON "reset_senha_tokens"("usuario_id");

-- AddForeignKey
ALTER TABLE "reset_senha_tokens" ADD CONSTRAINT "reset_senha_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
