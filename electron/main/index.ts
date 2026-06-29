import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { initDatabase, persist } from './db/index';
import { registerAssessmentHandlers } from './ipc/assessment';
import { registerCompanyHandlers } from './ipc/company';
import { registerCrawlerHandlers } from './ipc/crawler';
import { registerSettingsHandlers } from './ipc/settings';
import { registerAiHandlers } from './ipc/ai';
import { registerBackupHandlers } from './ipc/backup';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { label: '重置缩放', role: 'resetZoom' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '最大化', role: 'maximize' },
        { label: '关闭', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { 
          label: '新手入门指南',
          click: () => {
            const { shell } = require('electron');
            shell.openPath(path.join(__dirname, '../../GETTING_STARTED.md'));
          }
        },
        { 
          label: '项目文档',
          click: () => {
            const { shell } = require('electron');
            shell.openExternal('https://github.com/daimengyu01/career-assistant');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    x: 100,
    y: 100,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    console.log('Loading dev server at http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const rendererPath = path.join(__dirname, '../../dist-electron/index.html');
    console.log('Loading renderer at:', rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  // 监听加载失败，便于排查资源加载问题
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('页面加载失败:', code, desc);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createMenu();
  await initDatabase();
  registerAssessmentHandlers();
  registerCompanyHandlers();
  registerCrawlerHandlers();
  registerSettingsHandlers();
  registerAiHandlers();
  registerBackupHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
