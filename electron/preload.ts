import { contextBridge } from 'electron'

// Expose a basic API to the renderer process if needed
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true
})
