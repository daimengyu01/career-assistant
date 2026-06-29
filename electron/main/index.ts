import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, persist } from './db/index';
import { registerAssessmentHandlers } from './ipc/assessment';
import { registerCompanyHandlers } from './ipc/company';
import { registerCrawlerHandlers } from './ipc/crawler';
import { registerSettingsHandlers } from './ipc/settings';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initDatabase();
  registerAssessmentHandlers();
  registerCompanyHandlers();
  registerCrawlerHandlers();
  registerSettingsHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Persist database on app quit
app.on('before-quit', () => {
  persist();
});
