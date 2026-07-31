const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const PORTA_PADRAO = 3333;
const configPath = path.join(app.getPath("userData"), "config.json");

let janelaAtual = null;
let processoBackend = null;
let tray = null;
let saindoDeVerdade = false;

function criarTray(port) {
  if (tray) return;
  const icone = nativeImage.createFromPath(caminhoRecurso("frontend", "favicon.png")).resize({ width: 16, height: 16 });
  tray = new Tray(icone.isEmpty() ? nativeImage.createEmpty() : icone);
  tray.setToolTip("Extrusaick - Servidor");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Abrir Extrusaick - Servidor",
        click: () => {
          if (janelaAtual) {
            janelaAtual.show();
            janelaAtual.focus();
          }
        },
      },
      { type: "separator" },
      {
        label: "Sair (para o servidor)",
        click: () => {
          saindoDeVerdade = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", () => {
    if (janelaAtual) {
      janelaAtual.show();
      janelaAtual.focus();
    }
  });
}

function destruirTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

function lerConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return null;
  }
}

function salvarConfig(config) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function ipsLocais() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const nome of Object.keys(interfaces)) {
    for (const info of interfaces[nome] ?? []) {
      if (info.family === "IPv4" && !info.internal) ips.push(info.address);
    }
  }
  return ips;
}

function caminhoRecurso(...partes) {
  const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, "resources");
  return path.join(base, ...partes);
}

// Roda um script Node usando o próprio binário do Electron em "modo Node" —
// dispensa exigir Node.js instalado na máquina do cliente.
function rodarComoNode(scriptPath, args, env, cwd) {
  return new Promise((resolve, reject) => {
    const processo = spawn(process.execPath, [scriptPath, ...args], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", ...env },
      cwd: cwd ?? path.dirname(scriptPath),
    });
    let saida = "";
    processo.stdout?.on("data", (d) => (saida += d.toString()));
    processo.stderr?.on("data", (d) => (saida += d.toString()));
    processo.on("error", reject);
    processo.on("exit", (codigo) => {
      if (codigo === 0) resolve(saida);
      else reject(new Error(`Processo saiu com código ${codigo}:\n${saida}`));
    });
  });
}

async function rodarMigrations(databaseUrl) {
  const backendDir = caminhoRecurso("backend");
  const prismaCli = path.join(backendDir, "node_modules", "prisma", "build", "index.js");
  const schema = path.join(backendDir, "prisma", "schema.prisma");
  await rodarComoNode(
    prismaCli,
    ["migrate", "deploy", "--schema", schema],
    { DATABASE_URL: databaseUrl },
    backendDir,
  );
}

function iniciarBackend({ databaseUrl, jwtSecret, port }) {
  const backendDir = caminhoRecurso("backend");
  const serverScript = path.join(backendDir, "dist", "server.js");
  const frontendDir = caminhoRecurso("frontend");

  processoBackend = spawn(process.execPath, [serverScript], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      DATABASE_URL: databaseUrl,
      JWT_SECRET: jwtSecret,
      PORT: String(port),
      STATIC_DIR: frontendDir,
      CORS_ORIGIN: `http://localhost:${port}`,
    },
    cwd: backendDir,
  });

  processoBackend.stdout?.on("data", (d) => console.log("[backend]", d.toString()));
  processoBackend.stderr?.on("data", (d) => console.error("[backend]", d.toString()));
}

async function esperarBackendPronto(port, tentativas = 30) {
  for (let i = 0; i < tentativas; i++) {
    try {
      await fetch(`http://localhost:${port}/api/auth/me`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

function abrirJanelaSetup(erro) {
  if (janelaAtual) janelaAtual.destroy();
  janelaAtual = new BrowserWindow({
    width: 560,
    height: 620,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  janelaAtual.setMenuBarVisibility(false);
  janelaAtual.loadFile(path.join(__dirname, "setup.html"));
  if (erro) {
    janelaAtual.webContents.once("did-finish-load", () => {
      janelaAtual.webContents.send("erro-setup", erro);
    });
  }
}

function abrirJanelaStatus({ port, ips }) {
  if (janelaAtual) janelaAtual.destroy();
  janelaAtual = new BrowserWindow({
    width: 480,
    height: 480,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  janelaAtual.setMenuBarVisibility(false);
  janelaAtual.loadFile(path.join(__dirname, "status.html"));
  janelaAtual.webContents.once("did-finish-load", () => {
    janelaAtual.webContents.send("status", { port, ips });
  });
  janelaAtual.on("close", (event) => {
    if (!saindoDeVerdade) {
      event.preventDefault();
      janelaAtual.hide();
    }
  });
  criarTray(port);
}

async function iniciarComConfig(config) {
  try {
    await rodarMigrations(config.databaseUrl);
  } catch (erro) {
    abrirJanelaSetup(`Não foi possível conectar/migrar o banco de dados:\n\n${erro.message}`);
    return;
  }

  iniciarBackend(config);
  const pronto = await esperarBackendPronto(config.port);
  if (!pronto) {
    abrirJanelaSetup("O servidor não respondeu a tempo. Verifique a conexão com o banco e tente novamente.");
    return;
  }

  abrirJanelaStatus({ port: config.port, ips: ipsLocais() });
}

ipcMain.handle("salvar-config-inicial", async (_event, { databaseUrl, port }) => {
  const config = {
    databaseUrl,
    port: port || PORTA_PADRAO,
    jwtSecret: crypto.randomBytes(32).toString("hex"),
  };
  salvarConfig(config);
  await iniciarComConfig(config);
  return true;
});

ipcMain.handle("reconfigurar", async () => {
  destruirTray();
  if (processoBackend) {
    processoBackend.kill();
    processoBackend = null;
  }
  try {
    fs.unlinkSync(configPath);
  } catch {
    // sem config salva, nada a fazer
  }
  abrirJanelaSetup();
});

ipcMain.handle("abrir-sistema", (_event, port) => {
  const janelaApp = new BrowserWindow({ width: 1280, height: 800 });
  janelaApp.setMenuBarVisibility(false);
  janelaApp.loadURL(`http://localhost:${port}`);
});

app.whenReady().then(() => {
  const config = lerConfig();
  if (config?.databaseUrl) {
    iniciarComConfig(config);
  } else {
    abrirJanelaSetup();
  }
});

app.on("window-all-closed", () => {
  destruirTray();
  if (processoBackend) processoBackend.kill();
  app.quit();
});

app.on("before-quit", () => {
  saindoDeVerdade = true;
});
