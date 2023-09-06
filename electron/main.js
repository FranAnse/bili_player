// main.js
const ElectronStore = require('electron-store')
ElectronStore.initRenderer()
// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path')

let tray = null

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1380,
    height: 1000,
    frame: false,
    icon: '/src/assets/hydro.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,

    }
  })


  // tray = new Tray(path.join(__dirname, '../dist/hydro.ico'))

  tray = new Tray(path.join(__dirname, 'icon/hydro.ico'))
  // 菜单模板
  let menu = [
    {
      label: '显示主窗口',
      id: 'show-window',
      enabled: !mainWindow.show,
      click() {
        mainWindow.show();
      }
    },
    {
      label: '退出',
      role: 'quit'
    }
  ];

  menu = Menu.buildFromTemplate(menu)
  tray.setContextMenu(menu)

  tray.setToolTip('别摸了')

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })
  // 窗口最小化
  ipcMain.on('window-minisize', (ev) => {
    // 阻止最小化
    ev.preventDefault();
    // 隐藏窗口
    mainWindow.hide();
  })

  // 托盘图标被双击
  tray.on('double-click', () => {
    // 显示窗口
    mainWindow.show();
  });

  mainWindow.setMenu(null)

  // 加载 index.html
  mainWindow.loadURL(process.env.NODE_ENV === 'development'?'http://localhost:3000':`file://${path.join(__dirname,'../dist/index.html')}`) // 此处跟electron官网路径不同，需要注意
  // mainWindow.loadURL('http://localhost:3000')
  // 打开开发工具
  // mainWindow.webContents.openDevTools()
  

  // 窗口隐藏
  mainWindow.on('hide', () => {
    // 启用菜单的显示主窗口项
    menu.getMenuItemById('show-window').enabled = true;
    // 重新设置系统托盘菜单
    tray.setContextMenu(menu);
  });

  // 窗口显示
  mainWindow.on('show', () => {
    // 禁用显示主窗口项
    menu.getMenuItemById('show-window').enabled = false;
    // 重新设置系统托盘菜单
    tray.setContextMenu(menu);
  });
}


// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 在这个文件中，你可以包含应用程序剩余的所有部分的代码，
// 也可以拆分成几个文件，然后用 require 导入。