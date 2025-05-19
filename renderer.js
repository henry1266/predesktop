// 引入 socket.io 客戶端
const io = require('socket.io-client');
const { ipcRenderer } = require('electron');

// DOM 元素
const prescriptionDetailsContainer = document.getElementById('prescriptionDetailsContainer');
const rightInfoBox = document.getElementById('rightInfoBox');
const leftColumn = document.getElementById('leftColumn');
const cancelBtn = document.getElementById('cancelBtn');
const modifyBtn = document.getElementById('modifyBtn');
const closeBtn = document.getElementById('closeBtn');

// 連接到 Socket.IO 伺服器
const socket = io('http://localhost:3001');

// 閃爍動畫函數
function flashScreen() {
  // 移除可能存在的動畫類別
  document.body.classList.remove('flash-animation');
  
  // 強制重繪以確保動畫重置
  void document.body.offsetWidth;
  
  // 添加動畫類別
  document.body.classList.add('flash-animation');
  
  // 動畫結束後移除類別
  setTimeout(() => {
    document.body.classList.remove('flash-animation');
  }, 500); // 與 CSS 動畫時間一致
}

// 按鈕點擊事件
cancelBtn.addEventListener('click', function() {
  // 觸發閃爍動畫
  flashScreen();
  
  // 發送取消事件到伺服器
  socket.emit('prescription_cancel');
});

modifyBtn.addEventListener('click', function() {
  // 觸發閃爍動畫
  flashScreen();
  
  // 發送改單事件到伺服器
  socket.emit('prescription_modify');
});

// 關閉按鈕事件
closeBtn.addEventListener('click', function() {
  ipcRenderer.send('close-app');
});

// 接收取消事件
socket.on('prescription_cancel_broadcast', function() {
  // 觸發閃爍動畫
  flashScreen();
  
  // 將背景變為紅色
  document.body.style.backgroundColor = 'rgba(255, 204, 204, 0.8)'; // 半透明淺紅色背景
});

// 接收改單事件
socket.on('prescription_modify_broadcast', function() {
  // 觸發閃爍動畫
  flashScreen();
  
  // 將背景變為黃色
  document.body.style.backgroundColor = 'rgba(255, 255, 204, 0.8)'; // 半透明淺黃色背景
});

// 接收重置事件
socket.on('prescription_reset_broadcast', function() {
  // 恢復原始背景顏色
  document.body.style.backgroundColor = 'rgba(244, 244, 244, 0.8)';
});

function renderPrescription(prescription) {
  prescriptionDetailsContainer.innerHTML = '';
  rightInfoBox.innerHTML = '';

  if (!prescription || Object.keys(prescription).length === 0) {
    prescriptionDetailsContainer.innerHTML = '<p class="no-data">等待處方資料更新...</p>';
    rightInfoBox.innerHTML = '<p class="no-data">尚無處方資訊</p>';
    return;
  }

  // 左側基本資訊 + 藥品表格
  const infoDiv = document.createElement('div');
  infoDiv.classList.add('prescription-info');

  let content = '';
  content += `<p><strong>病患姓名:</strong> ${prescription.patientName || prescription.name || 'N/A'}`;
  content += `<strong>   日期:</strong> ${prescription.date ? new Date(prescription.date).toLocaleString() : 'N/A'}</p>`;
  if (prescription.status) content += `<p><strong>狀態:</strong> ${prescription.status}</p>`;
  infoDiv.innerHTML = content;
  prescriptionDetailsContainer.appendChild(infoDiv);

  // 藥品表格
  if (prescription.medications && Array.isArray(prescription.medications) && prescription.medications.length > 0) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    ['編號', '藥品名稱', '健保碼',  '頻率', '數量'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);     
    
    // 先對藥品進行排序，PRN排最下面，HS次之
    const sortedMedications = [...prescription.medications].sort((a, b) => {
      const freqA = a.frequency || 'N/A';
      const freqB = b.frequency || 'N/A';
      
      // PRN 排最後
      if (freqA === 'PRN' && freqB !== 'PRN') return 1;
      if (freqA !== 'PRN' && freqB === 'PRN') return -1;
      
      // HS 排次後
      if (freqA === 'HS' && freqB !== 'HS' && freqB !== 'PRN') return 1;
      if (freqA !== 'HS' && freqA !== 'PRN' && freqB === 'HS') return -1;
      
      // 其他情況維持原順序
      return 0;
    });
    
    // 使用排序後的藥品陣列，並帶入索引，以便加入編號
    sortedMedications.forEach((med, index) => {
      const row = document.createElement('tr');
      const number = index + 1; // 從1開始的編號
      const name = med.dname || 'N/A';
      const code = med.dinsuranceCode || 'N/A';
      const frequency = med.frequency || 'N/A';
      const quantity = med.dcount || 0;
      
      // 檢查頻率是否為PRN或HS，設定對應底色
      if (frequency === 'PRN') {
        row.style.backgroundColor = 'rgba(230, 247, 255, 0.8)'; // 半透明淺藍色背景
      } else if (frequency === 'HS') {
        row.style.backgroundColor = 'rgba(255, 230, 204, 0.8)'; // 半透明淺橘色背景
      }
      
      // 將編號加入資料陣列的第一個位置
      [number, name, code, frequency, quantity].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    prescriptionDetailsContainer.appendChild(table);
  } else {
    const noMedsP = document.createElement('p');
    noMedsP.textContent = '無藥品資訊。';
    prescriptionDetailsContainer.appendChild(noMedsP);
  }

  // 右側顯示「處方 ID」與「詳情」
  let rightContent = '';
  if (prescription.plusday && prescription.plusday !== 0) {
    const plusdayDisplay = `+++${prescription.plusday}天+++`;
    rightContent += `<p><strong style="color: red;">特殊註記 :</strong> ${plusdayDisplay}</p>`;
  }
  rightContent += `<p><strong>處方 ID:</strong> ${prescription._id || 'N/A'}</p>`;
  if (prescription.details) rightContent += `<p><strong>詳情:</strong> ${prescription.details}</p>`;
  rightInfoBox.innerHTML = rightContent;
}

socket.on('connect', () => {
  console.log('Connected to Socket.IO server!');
});

socket.on('initial_prescriptions', (initialDataArray) => {
  console.log('Received initial prescriptions:', initialDataArray);
  if (initialDataArray && initialDataArray.length > 0) {
    const latestInitial = initialDataArray.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
    renderPrescription(latestInitial);
  } else {
    prescriptionDetailsContainer.innerHTML = '<p class="no-data">目前無處方資料。</p>';
    rightInfoBox.innerHTML = '<p class="no-data">尚無處方資訊</p>';
  }
});

socket.on('prescription_update', (newPrescription) => {
  console.log('Received prescription update:', newPrescription);
  renderPrescription(newPrescription);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server.');
});

// 讓窗口可拖動
document.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('action-btn')) {
    // 如果點擊的是按鈕，不進行拖動
    return;
  }
  
  // 否則發送拖動事件
  ipcRenderer.send('drag-window');
});
