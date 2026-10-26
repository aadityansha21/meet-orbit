'use strict';

const { app, BrowserWindow, desktopCapturer, globalShortcut, ipcMain, screen } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');

const HOTKEY = 'CommandOrControl+Shift+Space';
const API_PORT = 8765;
const MAX_CAPTURE_WIDTH = 1280; // Keeps vision-model latency manageable.

let overlay = null;
let backend = null;

/** Spawns the FastAPI backend as a child process. */
function startBackend() {
  const python = process.env.ORBIT_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  backend = spawn(python, ['-m', 'uvicorn', 'app:app', '--port', String(API_PORT)], {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'inherit',
  });
  backend.on('error', (err) => console.error('[backend]', err.message));
}

/** Captures the primary display as a downscaled JPEG. */
async function captureScreen() {
  const { size, scaleFactor } = screen.getPrimaryDisplay();
  const [source] = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: size.width * scaleFactor, height: size.height * scaleFactor },
  });
  const image = source.thumbnail.resize({
    width: Math.min(MAX_CAPTURE_WIDTH, size.width * scaleFactor),
  });
  const { width, height } = image.getSize();
  return { imageB64: image.toJPEG(80).toString('base64'), width, height };
}

/** Creates the hidden, transparent, always-on-top overlay. */
function createOverlay() {
  const { bounds } = screen.getPrimaryDisplay();
  overlay = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    show: false,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.loadFile(path.join(__dirname, 'overlay.html'));
}

/** Toggles the overlay; captures first so the overlay is not in the screenshot. */
async function toggleOverlay() {
  if (overlay.isVisible()) {
    overlay.hide();
    return;
  }
  const capture = await captureScreen();
  overlay.webContents.send('capture', capture);
  overlay.show();
  overlay.focus();
}

app.whenReady().then(() => {
  startBackend();
  createOverlay();
  globalShortcut.register(HOTKEY, toggleOverlay);
  ipcMain.on('overlay:hide', () => overlay.hide());
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (backend) backend.kill();
});

// Tray-less app: keep running when the overlay is hidden.
app.on('window-all-closed', (event) => event.preventDefault());
