const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onNewDocument: (callback) => ipcRenderer.on('new-document', callback),
  onLoadFile: (callback) => ipcRenderer.on('load-file', callback),
  requestMarkdown: () => ipcRenderer.send('request-markdown'),
  saveMarkdown: (markdown) => ipcRenderer.send('save-markdown', markdown),
  showMessage: (message) => {
    alert(message); // Para uso básico, podrías usar una API más sofisticada
  }
});
