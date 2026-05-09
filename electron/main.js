const ElectronStore = require('electron-store')
ElectronStore.initRenderer()

const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } = require('electron')
const path = require('path')

const NORMAL_MIN_SIZE = [960, 680]
const MINI_MIN_SIZE = [360, 1]
const DEFAULT_NORMAL_BOUNDS = {
  width: 1380,
  height: 1000,
}
const MINI_PLAYER_BOUNDS = {
  width: 430,
  height: 260,
}
const MINI_PLAYLIST_BOUNDS = {
  width: 430,
  height: 560,
}
const CLOSE_PREPARE_TIMEOUT_MS = 2500

let tray = null
let mainWindow = null
let normalWindowBounds = null
let miniCollapsedBoundsBeforePlaylist = null
let isMiniPlayerWindow = false
let isMiniPlaylistExpanded = false
let isApplyingWindowBounds = false
let isCloseConfirmed = false
let isPreparingToClose = false
let closePrepareTimeout = null

function getAppUrl() {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`
}

function clearClosePrepareTimeout() {
  if (closePrepareTimeout) {
    clearTimeout(closePrepareTimeout)
    closePrepareTimeout = null
  }
}

function applyWindowBounds(bounds) {
  if (!mainWindow || !bounds) {
    return
  }

  isApplyingWindowBounds = true
  mainWindow.setBounds(bounds, true)

  setTimeout(() => {
    isApplyingWindowBounds = false
  }, 80)
}

function restoreWindowBounds(bounds) {
  if (!mainWindow || !bounds) {
    return
  }

  const hasPosition = Number.isFinite(bounds.x) && Number.isFinite(bounds.y)
  applyWindowBounds(bounds)

  if (!hasPosition) {
    mainWindow.center()
  }
}

function getCollapsedMiniBounds(bounds) {
  return {
    x: bounds?.x,
    y: bounds?.y,
    width: bounds?.width ?? MINI_PLAYER_BOUNDS.width,
    height: MINI_PLAYER_BOUNDS.height,
  }
}

function getInitialMiniBounds(bounds) {
  return {
    x: bounds?.x,
    y: bounds?.y,
    width: MINI_PLAYER_BOUNDS.width,
    height: MINI_PLAYER_BOUNDS.height,
  }
}

function getExpandedMiniBounds(bounds) {
  return {
    x: bounds?.x,
    y: bounds?.y,
    width: bounds?.width ?? MINI_PLAYLIST_BOUNDS.width,
    height: MINI_PLAYLIST_BOUNDS.height,
  }
}

function updateStoredBounds() {
  if (!mainWindow || isApplyingWindowBounds) {
    return
  }

  const currentBounds = mainWindow.getBounds()

  if (!isMiniPlayerWindow) {
    normalWindowBounds = currentBounds
  }
}

function updateMiniPlaylistLayout(isOpen) {
  if (!mainWindow || !isMiniPlayerWindow || isOpen === isMiniPlaylistExpanded) {
    return
  }

  const currentBounds = mainWindow.getBounds()

  if (isOpen) {
    miniCollapsedBoundsBeforePlaylist = { ...currentBounds }
    const expandedBounds = getExpandedMiniBounds(currentBounds)
    const heightDelta = expandedBounds.height - currentBounds.height

    applyWindowBounds({
      x: expandedBounds.x,
      y: heightDelta > 0 ? Math.max(0, currentBounds.y - heightDelta) : currentBounds.y,
      width: expandedBounds.width,
      height: expandedBounds.height,
    })
  } else if (miniCollapsedBoundsBeforePlaylist) {
    const collapsedBounds = getCollapsedMiniBounds(miniCollapsedBoundsBeforePlaylist)

    applyWindowBounds(collapsedBounds)
    miniCollapsedBoundsBeforePlaylist = null
  }

  isMiniPlaylistExpanded = isOpen
}

function setMiniPlayerMode(enabled) {
  if (!mainWindow || enabled === isMiniPlayerWindow) {
    return
  }

  if (enabled) {
    normalWindowBounds = mainWindow.getBounds()

    isMiniPlayerWindow = true
    isMiniPlaylistExpanded = false
    miniCollapsedBoundsBeforePlaylist = null

    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setMinimumSize(...MINI_MIN_SIZE)
    restoreWindowBounds(getInitialMiniBounds(mainWindow.getBounds()))
    return
  }

  isMiniPlayerWindow = false
  isMiniPlaylistExpanded = false
  miniCollapsedBoundsBeforePlaylist = null

  mainWindow.setAlwaysOnTop(false)
  mainWindow.setMinimumSize(...NORMAL_MIN_SIZE)
  restoreWindowBounds(normalWindowBounds || DEFAULT_NORMAL_BOUNDS)
}

function forceCloseMainWindow() {
  clearClosePrepareTimeout()
  isPreparingToClose = false

  if (!mainWindow || mainWindow.isDestroyed()) {
    app.quit()
    return
  }

  isCloseConfirmed = true
  mainWindow.close()
}

function requestWindowClosePreparation() {
  if (!mainWindow || mainWindow.isDestroyed() || isPreparingToClose) {
    return
  }

  isPreparingToClose = true

  if (!mainWindow.webContents || mainWindow.webContents.isDestroyed()) {
    forceCloseMainWindow()
    return
  }

  clearClosePrepareTimeout()
  closePrepareTimeout = setTimeout(() => {
    forceCloseMainWindow()
  }, CLOSE_PREPARE_TIMEOUT_MS)

  mainWindow.webContents.send('app-before-close-request')
}

function buildTrayMenu() {
  const menuTemplate = [
    {
      label: '显示主窗口',
      id: 'show-window',
      enabled: mainWindow ? !mainWindow.isVisible() : true,
      click() {
        if (mainWindow) {
          mainWindow.show()
        }
      },
    },
    {
      label: '退出',
      click() {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.close()
        } else {
          app.quit()
        }
      },
    },
  ]

  return Menu.buildFromTemplate(menuTemplate)
}

function refreshTrayMenu() {
  if (!tray) {
    return
  }

  tray.setContextMenu(buildTrayMenu())
}

function registerIpcHandlers() {
  ipcMain.on('window-close', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  })

  ipcMain.on('window-close-confirmed', () => {
    forceCloseMainWindow()
  })

  ipcMain.on('window-minisize', (event) => {
    event.preventDefault()

    if (mainWindow) {
      mainWindow.hide()
    }
  })

  ipcMain.on('window-toggle-mini-player', (event, enabled) => {
    setMiniPlayerMode(Boolean(enabled))
  })

  ipcMain.on('window-set-mini-playlist-open', (event, isOpen) => {
    updateMiniPlaylistLayout(Boolean(isOpen))
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_NORMAL_BOUNDS.width,
    height: DEFAULT_NORMAL_BOUNDS.height,
    minWidth: NORMAL_MIN_SIZE[0],
    minHeight: NORMAL_MIN_SIZE[1],
    frame: false,
    icon: '/src/assets/hydro.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  })

  normalWindowBounds = mainWindow.getBounds()
  tray = new Tray(path.join(__dirname, 'icon/hydro.ico'))
  tray.setToolTip('BiliPlayer')
  refreshTrayMenu()

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  mainWindow.setMenu(null)
  mainWindow.loadURL(getAppUrl())

  mainWindow.on('close', (event) => {
    if (isCloseConfirmed) {
      isCloseConfirmed = false
      return
    }

    event.preventDefault()
    requestWindowClosePreparation()
  })

  mainWindow.on('closed', () => {
    clearClosePrepareTimeout()
    mainWindow = null
  })

  mainWindow.on('resize', () => {
    updateStoredBounds()
  })

  mainWindow.on('move', () => {
    updateStoredBounds()
  })

  mainWindow.on('hide', () => {
    refreshTrayMenu()
  })

  mainWindow.on('show', () => {
    refreshTrayMenu()
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  globalShortcut.register('Alt+CommandOrControl+/', () => {
    if (!mainWindow) {
      return
    }

    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
