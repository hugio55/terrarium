const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 1000,
    minHeight: 600,
    title: 'PLANTZ',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  })

  // app.isPackaged is the reliable way to detect production vs dev
  if (app.isPackaged) {
    // Production: load from the built dist folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // Development: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173')
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
