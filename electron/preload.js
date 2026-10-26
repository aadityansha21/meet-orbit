'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbit', {
  onCapture: (callback) => ipcRenderer.on('capture', (_event, payload) => callback(payload)),
  hide: () => ipcRenderer.send('overlay:hide'),
});
