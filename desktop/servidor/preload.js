const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("servidorApp", {
  salvarConfigInicial: (dados) => ipcRenderer.invoke("salvar-config-inicial", dados),
  reconfigurar: () => ipcRenderer.invoke("reconfigurar"),
  abrirSistema: (port) => ipcRenderer.invoke("abrir-sistema", port),
  aoReceberErroSetup: (callback) => ipcRenderer.on("erro-setup", (_event, msg) => callback(msg)),
  aoReceberStatus: (callback) => ipcRenderer.on("status", (_event, dados) => callback(dados)),
});
