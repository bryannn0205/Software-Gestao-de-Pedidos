-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bloqueado_ate" TIMESTAMP(3),
ADD COLUMN     "tentativas_login" INTEGER NOT NULL DEFAULT 0;
