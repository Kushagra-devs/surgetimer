const path = require('node:path');
const http = require('node:http');
const { app, BrowserWindow, Menu, globalShortcut, shell, screen } = require('electron');

const CUSTOM_PROTOCOL = 'surgetimer-widget';
const LAUNCHER_PORT = Number(process.env.WIDGET_LAUNCHER_PORT || 43123);
const DEFAULT_URL = process.env.WIDGET_URL || 'https://surgetimer.vercel.app/overlay/widget?desktop=1';
const DEFAULT_WIDTH = Number(process.env.WIDGET_WIDTH || 760);
const DEFAULT_HEIGHT = Number(process.env.WIDGET_HEIGHT || 280);

let widgetWindow = null;
let locked = false;
let currentUrl = DEFAULT_URL;
let currentWidth = DEFAULT_WIDTH;
let currentHeight = DEFAULT_HEIGHT;
let pendingLaunchCommand = null;
let launcherServer = null;

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

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function normaliseLaunchPayload(payload) {
  return {
    url: typeof payload?.url === 'string' && payload.url ? payload.url : DEFAULT_URL,
    width: Number.isFinite(Number(payload?.width)) && Number(payload.width) > 0 ? Number(payload.width) : DEFAULT_WIDTH,
    height: Number.isFinite(Number(payload?.height)) && Number(payload.height) > 0 ? Number(payload.height) : DEFAULT_HEIGHT,
  };
}

function startLauncherServer() {
  if (launcherServer) {
    return;
  }

  launcherServer = http.createServer(async (request, response) => {
    if (!request.url) {
      writeJson(response, 404, { ok: false });
      return;
    }

    if (request.method === 'OPTIONS') {
      writeJson(response, 204, {});
      return;
    }

    if (request.method === 'GET' && request.url === '/health') {
      writeJson(response, 200, {
        ok: true,
        app: 'SurgeTimer Widget Launcher',
        url: currentUrl,
        width: currentWidth,
        height: currentHeight,
      });
      return;
    }

    if (request.method === 'POST' && request.url === '/launch') {
      try {
        const body = await readJsonBody(request);
        const command = normaliseLaunchPayload(body);
        applyLaunchCommand(command);
        writeJson(response, 200, {
          ok: true,
          launched: true,
          url: currentUrl,
          width: currentWidth,
          height: currentHeight,
        });
      } catch (error) {
        writeJson(response, 400, {
          ok: false,
          reason: error instanceof Error ? error.message : 'Invalid widget launch payload.',
        });
      }
      return;
    }

    if (request.method === 'POST' && request.url === '/close') {
      app.quit();
      writeJson(response, 200, { ok: true, closed: true });
      return;
    }

    writeJson(response, 404, { ok: false, reason: 'Not found' });
  });

  launcherServer.listen(LAUNCHER_PORT, '127.0.0.1');
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
  startLauncherServer();
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
  if (launcherServer) {
    launcherServer.close();
    launcherServer = null;
  }
});
