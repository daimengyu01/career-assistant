import { ipcMain, dialog } from 'electron';
import Store from 'electron-store';
import { getDb, persist } from '../db/index';
import fs from 'fs';

const store = new Store<{
  apiKeys: Record<string, string>;
  aiProvider: string;
  aiModel: string;
  prompts: Record<string, string>;
}>({
  name: 'settings',
  encryptionKey: 'career-assistant-encryption-key',
});

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    return store.store;
  });

  ipcMain.handle('settings:save', async (_event, settings: Record<string, unknown>) => {
    Object.assign(store.store, settings);
    store.save();
    return { success: true };
  });

  ipcMain.handle('settings:export', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出设置',
      defaultPath: 'career-assistant-settings.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { success: false };
    fs.writeFileSync(filePath, JSON.stringify(store.store, null, 2));
    return { success: true, path: filePath };
  });

  ipcMain.handle('settings:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '导入设置',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (canceled || !filePaths || filePaths.length === 0) return { success: false };
    const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    store.store = { ...store.store, ...data };
    store.save();
    return { success: true };
  });
}
