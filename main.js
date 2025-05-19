const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 保持對window對象的全局引用，如果不這樣做，
// 當JavaScript對象被垃圾回收時，window對象將自動關閉
let mainWindow;

function createWindow() {
  // 創建瀏覽器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    transparent: true, // 啟用透明
    frame: false, // 無邊框
    alwaysOnTop: true, // 總是置頂
    resizable: true, // 允許調整大小
    webPreferences: {
      nodeIntegration: true, // 允許在渲染進程中使用Node.js
      contextIsolation: false, // 禁用上下文隔離
      enableRemoteModule: true // 啟用remote模塊
    }
  });

  // 加載應用的index.html
  mainWindow.loadFile('index.html');

  // 打開開發者工具
  // mainWindow.webContents.openDevTools();

  // 當window被關閉時，觸發以下事件
  mainWindow.on('closed', function () {
    // 取消引用window對象，如果你的應用支持多窗口，
    // 通常會將window對象存儲在數組中，
    // 這時你應該刪除相應的元素
    mainWindow = null;
  });
  
  // 設置窗口為半透明
  mainWindow.setOpacity(0.9);
}

// 當Electron完成初始化並準備創建瀏覽器窗口時，調用此方法
app.whenReady().then(createWindow);

// 當所有窗口關閉時退出應用
app.on('window-all-closed', function () {
  // 在macOS上，除非用戶使用Cmd + Q明確退出，
  // 否則應用及其菜單欄通常會保持活動狀態
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // 在macOS上，當點擊dock圖標並且沒有其他窗口打開時，
  // 通常會在應用中重新創建一個窗口
  if (mainWindow === null) createWindow();
});

// 處理從渲染進程發來的關閉應用請求
ipcMain.on('close-app', () => {
  app.quit();
});

// 處理從渲染進程發來的拖動窗口請求
ipcMain.on('drag-window', () => {
  if (mainWindow) {
    mainWindow.dragWindow();
  }
});

// 在這個文件中，你可以包含應用程序特定的主進程代碼
// 你也可以將它們放在單獨的文件中，然後在這裡導入
