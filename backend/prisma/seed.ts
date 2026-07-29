import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const PERFIS = [
  {
    nome: "Administrador",
    permissoes: {
      clientes: ["read", "write"],
      produtos: ["read", "write"],
      pedidos: ["read", "write"],
      producao: ["read", "write"],
      financeiro: ["read", "write"],
      dashboard: ["read"],
      admin: ["read", "write"],
    },
  },
  {
    nome: "Vendas/Comercial",
    permissoes: {
      clientes: ["read", "write"],
      produtos: ["read"],
      pedidos: ["read", "write"],
      dashboard: ["read"],
    },
  },
  {
    nome: "Produção",
    permissoes: {
      producao: ["read", "write"],
    },
  },
  {
    nome: "Financeiro",
    permissoes: {
      pedidos: ["read"],
      financeiro: ["read", "write"],
      dashboard: ["read"],
    },
  },
  {
    nome: "Leitura/Gerência",
    permissoes: {
      dashboard: ["read"],
    },
  },
];

const DOMINIOS: { tipo: string; valores: string[] }[] = [
  {
    tipo: "MATERIAL",
    valores: [
      "Polietileno",
      "PEAD",
      "PEBD",
      "Polipropileno",
      "BOPP",
      "Ráfia",
      "Papel",
      "Plástico",
      "Vidro",
      "Metal",
    ],
  },
  { tipo: "MEDIDA", valores: ["30x40", "40x60", "50x80", "60x90"] },
  { tipo: "MICRAGEM", valores: ["0,03", "0,04", "0,05", "0,06", "0,08", "0,10", "0,14"] },
  {
    tipo: "COR",
    valores: [
      "Azul",
      "Branco",
      "Vermelho",
      "Transparente",
      "Verde",
      "Leitoso",
      "Amarelo",
      "Marrom",
      "Preto",
      "Cinza",
      "Colorido",
      "Personalizado",
    ],
  },
  { tipo: "TIPO_RESIDUO", valores: ["Comum", "Saúde/Hospitalar", "Orgânico"] },
  {
    tipo: "FORMA_PAGAMENTO",
    valores: ["Dinheiro", "Pix", "Cartão", "Boleto", "Transferência"],
  },
];

const PARAMETROS: Record<string, string> = {
  prazo_padrao_dias: "7",
  empresa_nome: "EXTRUSAICK POLÍMEROS",
  empresa_marca: "EL-PACK",
  empresa_cnpj: "40.772.936/0001-55",
  empresa_telefone: "(19) 9.9776-4661",
  empresa_cidade_uf: "Araras/SP",
};

async function main() {
  console.log("Seed: criando perfis...");
  const perfisCriados = new Map<string, string>();
  for (const perfil of PERFIS) {
    const registro = await prisma.perfil.upsert({
      where: { nome: perfil.nome },
      update: { permissoes: perfil.permissoes },
      create: { nome: perfil.nome, permissoes: perfil.permissoes },
    });
    perfisCriados.set(perfil.nome, registro.id);
  }

  console.log("Seed: criando usuário administrador inicial...");
  const emailAdmin = "admin@elpack.local";
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  if (!usuarioExistente) {
    const senhaHash = await argon2.hash("TrocarSenha123!");
    await prisma.usuario.create({
      data: {
        nome: "Administrador",
        email: emailAdmin,
        senhaHash,
        perfilId: perfisCriados.get("Administrador")!,
      },
    });
    console.log(`  -> usuário criado: ${emailAdmin} / senha: TrocarSenha123! (troque no primeiro acesso)`);
  } else {
    console.log("  -> usuário administrador já existe, mantido.");
  }

  console.log("Seed: criando tabelas de domínio...");
  for (const grupo of DOMINIOS) {
    for (const valor of grupo.valores) {
      await prisma.dominio.upsert({
        where: { tipo_valor: { tipo: grupo.tipo as any, valor } },
        update: {},
        create: { tipo: grupo.tipo as any, valor },
      });
    }
  }

  console.log("Seed: criando parâmetros do sistema...");
  for (const [chave, valor] of Object.entries(PARAMETROS)) {
    await prisma.parametro.upsert({ where: { chave }, update: {}, create: { chave, valor } });
  }

  console.log("Seed: inicializando sequência de numeração de pedidos...");
  await prisma.sequenciaPedido.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, proximoNumero: 1 },
  });

  console.log("Seed concluído. Banco de dados vazio de dados de negócio (clientes/produtos/pedidos), conforme especificação.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
