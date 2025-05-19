# Windows 打包指南

## 環境準備
1. 確保已安裝 Node.js (建議 v18 或更高版本)
2. 確保已安裝 Git

## 下載與安裝步驟
1. 克隆專案：
```
git clone https://github.com/henry1266/predesktop.git
cd predesktop
```

2. 安裝依賴：
```
npm install
```

3. 測試應用：
```
npm start
```

4. 打包為 Windows 可執行檔：
```
npm run build
```

5. 打包完成後，可執行檔將位於 `dist` 目錄中

## 應用功能說明
- 半透明懸浮視窗，可拖曳移動
- 與 realtime-prescriptions 頁面相似的 UI
- 「取消」按鈕：點擊後所有連接的頁面背景變紅色
- 「改單」按鈕：點擊後所有連接的頁面背景變黃色
- 點擊按鈕時會有螢幕閃爍動畫效果
- 新處方進來時自動恢復原背景顏色

## 注意事項
- 應用預設連接到 localhost:3001 的 Socket.IO 伺服器
- 如需修改連接地址，請編輯 renderer.js 中的 socket 連接設定
