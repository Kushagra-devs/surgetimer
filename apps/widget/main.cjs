const { app, BrowserWindow, Menu, globalShortcut, shell, screen } = require('electron');

const DEFAULT_URL = process.env.WIDGET_URL || 'https://surgetimer.vercel.app/overlay/widget?desktop=1';
const DEFAULT_WIDTH = Number(process.env.WIDGET_WIDTH || 760);
const DEFAULT_HEIGHT = Number(process.env.WIDGET_HEIGHT || 280);

let widgetWindow = null;
let locked = false;

function createWidgetWindow() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;

  widgetWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: area.x + area.width - DEFAULT_WIDTH - 40,
    y: area.y + 40,
    show: false,
    transparent: true,
    frame: false,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    title: 'SurgeTimer Widget',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWindow.setAlwaysOnTop(true, 'screen-saver');
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widgetWindow.loadURL(DEFAULT_URL);

  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
  });

  widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  buildMenu();
}

function toggleLock() {
  if (!widgetWindow) {
    return;
  }
  locked = !locked;
  widgetWindow.setIgnoreMouseEvents(locked, { forward: true });
  buildMenu();
}

function reloadWidget() {
  if (widgetWindow) {
    widgetWindow.loadURL(DEFAULT_URL);
  }
}

function buildMenu() {
  const template = [
    {
      label: 'Widget',
      submenu: [
        {
          label: 'Reload Overlay',
          click: reloadWidget,
        },
        {
          label: locked ? 'Unlock Interaction' : 'Lock Click-Through',
          click: toggleLock,
        },
        {
          label: 'Open Full Overlay',
          click: () => shell.openExternal(DEFAULT_URL.replace('/overlay/widget?desktop=1', '/overlay/live')),
        },
        {
          label: 'Quit Widget',
          click: () => app.quit(),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWidgetWindow();

  globalShortcut.register('CommandOrControl+Shift+R', reloadWidget);
  globalShortcut.register('CommandOrControl+Shift+L', toggleLock);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWidgetWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
