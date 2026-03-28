const path = require('node:path');
const { app, BrowserWindow, Menu, globalShortcut, shell, screen } = require('electron');

const CUSTOM_PROTOCOL = 'surgetimer-widget';
const DEFAULT_URL = process.env.WIDGET_URL || 'https://surgetimer.vercel.app/overlay/widget?desktop=1';
const DEFAULT_WIDTH = Number(process.env.WIDGET_WIDTH || 760);
const DEFAULT_HEIGHT = Number(process.env.WIDGET_HEIGHT || 280);

let widgetWindow = null;
let locked = false;
let currentUrl = DEFAULT_URL;
let currentWidth = DEFAULT_WIDTH;
let currentHeight = DEFAULT_HEIGHT;
let pendingLaunchCommand = null;

function parseLaunchCommand(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== `${CUSTOM_PROTOCOL}:`) {
      return null;
    }

    const nextUrl = parsed.searchParams.get('url') || DEFAULT_URL;
    const width = Number(parsed.searchParams.get('width') || DEFAULT_WIDTH);
    const height = Number(parsed.searchParams.get('height') || DEFAULT_HEIGHT);

    return {
      url: nextUrl,
      width: Number.isFinite(width) && width > 0 ? width : DEFAULT_WIDTH,
      height: Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT,
    };
  } catch {
    return null;
  }
}

function parseLaunchCommandFromArgv(argv) {
  return argv
    .map((value) => parseLaunchCommand(value))
    .find((value) => value !== null) ?? null;
}

function applyLaunchCommand(command) {
  if (!command) {
    return;
  }

  currentUrl = command.url || DEFAULT_URL;
  currentWidth = command.width || DEFAULT_WIDTH;
  currentHeight = command.height || DEFAULT_HEIGHT;

  if (!widgetWindow) {
    createWidgetWindow();
    return;
  }

  widgetWindow.setSize(currentWidth, currentHeight);
  widgetWindow.loadURL(currentUrl);
  widgetWindow.show();
  widgetWindow.focus();
}

function registerProtocolClient() {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    return;
  }

  app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL);
}

function createWidgetWindow() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;

  widgetWindow = new BrowserWindow({
    width: currentWidth,
    height: currentHeight,
    x: area.x + area.width - currentWidth - 40,
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
  widgetWindow.loadURL(currentUrl);

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
    widgetWindow.loadURL(currentUrl);
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
          click: () => shell.openExternal(currentUrl.replace('/overlay/widget?desktop=1', '/overlay/live').replace('/overlay/widget?', '/overlay/live?')),
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

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

app.on('second-instance', (_event, argv) => {
  const command = parseLaunchCommandFromArgv(argv);
  applyLaunchCommand(command);
});

app.on('open-url', (event, rawUrl) => {
  event.preventDefault();
  const command = parseLaunchCommand(rawUrl);
  if (!app.isReady()) {
    pendingLaunchCommand = command;
    return;
  }

  applyLaunchCommand(command);
});

app.whenReady().then(() => {
  registerProtocolClient();
  pendingLaunchCommand = pendingLaunchCommand ?? parseLaunchCommandFromArgv(process.argv);
  createWidgetWindow();
  applyLaunchCommand(pendingLaunchCommand);
  pendingLaunchCommand = null;

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
