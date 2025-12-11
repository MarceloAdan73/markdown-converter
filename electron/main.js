const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/logo192.png'),
    title: 'Markdown Converter',
    autoHideMenuBar: true  // Oculta la barra de menú por defecto
  });

  // Siempre cargar de localhost:3000 (para desarrollo con npm start)
  mainWindow.loadURL('http://localhost:3000');
  
  // DevTools se pueden abrir manualmente con Ctrl+Shift+I o F12
  // mainWindow.webContents.openDevTools(); // COMENTADO
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
