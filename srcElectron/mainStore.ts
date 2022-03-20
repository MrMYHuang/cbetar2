// Modules to control application life and create native browser window
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell } from 'electron';
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const PackageInfos = require('../package.json');

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
let mainWindow: BrowserWindow | null | undefined;

function isDevMode() {
  return !app.isPackaged || (process as any).defaultApp;
}

const template = [
  new MenuItem({
    label: '檔案',
    submenu: [
      {
        role: 'quit',
        label: '關閉',
      },
    ]
  }),
  new MenuItem({
    label: '編輯',
    submenu: [
      {
        role: 'undo',
        label: '還原',
      },
      {
        role: 'redo',
        label: '重作',
      },
      {
        role: 'selectAll',
        label: '全選',
      },
      {
        role: 'cut',
        label: '剪下',
      },
      {
        role: 'copy',
        label: '複製',
      },
      {
        role: 'paste',
        label: '貼上',
      },
    ]
  }),
  new MenuItem({
    label: '顯示',
    submenu: [
      {
        role: 'togglefullscreen',
        label: '全螢幕',
      },
      {
        role: 'toggleDevTools',
        label: '開發者工具',
      },
    ]
  }),
  new MenuItem({
    label: '執行',
    submenu: [
      {
        role: 'forceReload',
        label: '強制重新載入',
      },
    ]
  }),
  new MenuItem({
    label: '視窗',
    submenu: [
      {
        label: '最小化',
        role: 'minimize'
      },
      process.platform === 'darwin' ?
        {
          label: '新視窗',
          click: () => {
            createWindow();
          }
        } : null,
      {
        label: '關閉視窗',
        role: 'close'
      }
    ].filter(v => v != null) as any
  }),
];
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

async function createWindow() {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      nativeWindowOpen: false,
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  ipcMain.on('toMain', (ev, args) => {
    switch (args.event) {
      case 'ready':
        mainWindow?.webContents.send('fromMain', { event: 'version', version: PackageInfos.version });
        break;
    }
  });

  const clearListeners = () => {
    mainWindow?.webContents.removeAllListeners('did-finish-load');
    mainWindow?.webContents.removeAllListeners('did-fail-load');
  }

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  let loadUrlSuccess = false;
  while (!loadUrlSuccess) {
    try {
      await new Promise<any>(async (ok, fail) => {
        mainWindow?.webContents.once('did-finish-load', (res: any) => {
          loadUrlSuccess = true;
          clearListeners();
          ok('');
        });
        mainWindow?.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
          clearListeners();
          fail(`Error ${errorCode}: ${errorDescription}`);
        });

        try {
          if (isDevMode()) {
            await mainWindow?.loadURL('http://localhost:3000');
          } else {
            await mainWindow?.loadURL('https://mrmyhuang.github.io');
          }
        } catch (error) {
          fail(error);
        }
      });
    } catch (error) {
      clearListeners();
      console.error(error);
      const buttonId = dialog.showMessageBoxSync(mainWindow!, {
        message: `網路連線異常，請重試！\n${error}`,
        buttons: ['重試', '取消'],
      })

      if (buttonId === 1) {
        loadUrlSuccess = true;
      }
    }
  }

  // Open web link by external browser.
  mainWindow?.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
 });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
