// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
import PackageInfos from '../../package.json';
app.commandLine.appendSwitch('ignore-certificate-errors', true);

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  mainWindow.loadURL('https://mrmyhuang.github.io');

  ipcMain.on('rendererReady', () => {
    mainWindow.webContents.send('mainVersion', PackageInfos.version);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
