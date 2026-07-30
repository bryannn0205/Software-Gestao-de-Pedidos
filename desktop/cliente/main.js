const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const configPath = path.join(app.getPath("userData"), "config.json");

let janelaPrincipal = null;
let janelaSetup = null;

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

function normalizarEndereco(valor) {
  const semEspacos = valor.trim();
  if (/^https?:\/\//i.test(semEspacos)) return semEspacos.replace(/\/+$/, "");
  return `http://${semEspacos}`.replace(/\/+$/, "");
}

function montarMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Configurações",
        submenu: [
          { label: "Recarregar", accelerator: "F5", click: () => janelaPrincipal?.reload() },
          { label: "Trocar servidor", click: () => trocarServidor() },
          { type: "separator" },
          { role: "quit", label: "Sair" },
        ],
      },
    ]),
  );
}

function abrirSetup() {
  if (janelaPrincipal) {
    janelaPrincipal.close();
    janelaPrincipal = null;
  }
  janelaSetup = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  janelaSetup.setMenuBarVisibility(false);
  janelaSetup.loadFile(path.join(__dirname, "setup.html"));
}

function trocarServidor() {
  try {
    fs.unlinkSync(configPath);
  } catch {
    // sem config salva, nada a fazer
  }
  abrirSetup();
}

function abrirPrincipal(serverUrl) {
  if (janelaSetup) {
    janelaSetup.close();
    janelaSetup = null;
  }
  janelaPrincipal = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  montarMenu();
  janelaPrincipal.once("ready-to-show", () => janelaPrincipal.show());

  janelaPrincipal.webContents.on("did-fail-load", (_event, codigoErro) => {
    if (codigoErro === -3) return; // ERR_ABORTED (navegação cancelada, ex: troca rápida de rota) — ignorar
    janelaPrincipal.loadFile(path.join(__dirname, "erro-conexao.html"), {
      query: { servidor: serverUrl },
    });
  });

  janelaPrincipal.loadURL(serverUrl);
}

ipcMain.handle("testar-e-salvar-servidor", async (_event, enderecoBruto) => {
  const serverUrl = normalizarEndereco(enderecoBruto);
  try {
    await fetch(`${serverUrl}/api/auth/me`);
  } catch (erro) {
    return { ok: false, erro: `Não foi possível alcançar ${serverUrl}.\n\n${erro.message}` };
  }
  salvarConfig({ serverUrl });
  abrirPrincipal(serverUrl);
  return { ok: true };
});

ipcMain.handle("reconfigurar", () => trocarServidor());

ipcMain.handle("tentar-novamente", () => {
  const config = lerConfig();
  if (config?.serverUrl && janelaPrincipal) {
    janelaPrincipal.loadURL(config.serverUrl);
  }
});

app.whenReady().then(() => {
  const config = lerConfig();
  if (config?.serverUrl) {
    abrirPrincipal(config.serverUrl);
  } else {
    abrirSetup();
  }
});

app.on("window-all-closed", () => app.quit());
