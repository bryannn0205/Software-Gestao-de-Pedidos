const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clienteApp", {
  testarESalvarServidor: (endereco) => ipcRenderer.invoke("testar-e-salvar-servidor", endereco),
  reconfigurar: () => ipcRenderer.invoke("reconfigurar"),
  tentarNovamente: () => ipcRenderer.invoke("tentar-novamente"),
});
