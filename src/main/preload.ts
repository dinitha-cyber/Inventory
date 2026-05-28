import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: () => ipcRenderer.invoke('get-env'),
});
