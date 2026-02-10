// 全局变量
let currentDate = new Date(2026, 1, 1);
let activeCategory = '全部动态';
let selectedYear = 2026;
let selectedMonth = '';
let selectedDay = '';
let eventsData = {}; // 当前月份行程数据
let loadedMonths = {}; // 记录已加载月份，避免重复请求

// ========== 行程卡片渲染函数（修复图片+链接） ==========
function renderEventCard(dateStr, event) {
  const [year, month, day] = dateStr.split('-');
  const tagInfo = getTagBgColor(event.tag);
  const dayNum = day.padStart(2, '0');

  // 图片基础配置
  const imgBaseUrl = "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/";
  const defaultImg = imgBaseUrl + "20260201Figaro.jpg";
  
  // 1. 处理多图数据
  let imgList = [];
  if (Array.isArray(event.image)) {
    imgList = event.image.filter(img => img); // 过滤空值
  } else if (event.image) {
    imgList = [event.image];
  }
  
  // 2. 构建图片预览区域（支持点击放大）
  let imgHtml = '';
  if (imgList.length > 0) {
    imgHtml = `
      <div style="width:80px;height:80px;border-radius:8px;overflow:hidden;position:relative;">
        <img 
          src="${imgBaseUrl}${imgList[0]}" 
          class="event-img" 
          data-imgs='${JSON.stringify(imgList)}' 
          style="width:100%;height:100%;object-fit:cover;cursor:pointer;"
          onclick="openImgPreview(this.dataset.imgs, 0); return false;"
        />
        ${imgList.length > 1 ? `<div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:white;font-size:10px;padding:1px 4px;border-radius:3px;">${imgList.length}张</div>` : ''}
      </div>
    `;
  } else {
    imgHtml = `
      <div style="width:80px;height:80px;border-radius:8px;overflow:hidden;">
        <img 
          src="${defaultImg}" 
          class="event-img" 
          data-imgs='["20260201Figaro.jpg"]' 
          style="width:100%;height:100%;object-fit:cover;cursor:pointer;"
          onclick="openImgPreview(this.dataset.imgs, 0); return false;"
        />
      </div>
    `;
  }

  // 3. 处理标题链接（支持点击跳转）
  let titleHtml = '';
  if (event.link) {
    titleHtml = `
      <a href="${event.link}" target="_blank" style="color:inherit;text-decoration:none;">
        ${event.title}
      </a>
    `;
  } else {
    titleHtml = event.title;
  }

  const semiTransparentWhiteBg = "rgba(255, 255, 255, 0.2)";
  const textColor = "#fff";
  const cardRadius = "16px";

  return `
    <div style="background:${tagInfo.color};border-radius:${cardRadius};padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;color:${textColor};font-family:微软雅黑, sans-serif;">
      <div style="width:36px;height:36px;border-radius:50%;background:${semiTransparentWhiteBg};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">
        ${dayNum}
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="background:${semiTransparentWhiteBg};border-radius:4px;padding:3px 8px;font-size:12px;font-weight:600;">
            ${tagInfo.text}
          </div>
          <div style="font-size:16px;font-weight:bold;flex:1;min-width:100px;">
            ${titleHtml}
          </div>
        </div>
        <div style="font-size:12px;opacity:0.8;margin-top:4px;">
          ${year}年${month}月${day}日 ${event.time || '未知时间'}
        </div>
      </div>
      ${imgHtml}
    </div>
  `;
}

// ========== 多图预览弹窗（核心修复） ==========
function openImgPreview(imgsJson, startIndex) {
  // 解析图片数组
  const imgList = JSON.parse(imgsJson);
  const imgBaseUrl = "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/";
  
  // 创建弹窗容器
  const modal = document.createElement('div');
  modal.id = 'imgPreviewModal';
  modal.style = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.9); display: flex; align-items: center;
    justify-content: center; z-index: 9999;
  `;

  // 预览图片
  const previewImg = document.createElement('img');
  previewImg.id = 'previewImg';
  previewImg.src = imgBaseUrl + imgList[startIndex];
  previewImg.style = 'max-width: 90%; max-height: 90%; object-fit: contain;';

  // 关闭按钮
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.style = `
    position: absolute; top: 20px; right: 30px; color: #fff; font-size: 40px;
    font-weight: bold; cursor: pointer; user-select: none;
  `;
  closeBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  // 上一张按钮（多图时显示）
  const prevBtn = document.createElement('span');
  prevBtn.className = 'prev-btn';
  prevBtn.textContent = '←';
  prevBtn.style = `
    position: absolute; left: 20px; color: #fff; font-size: 48px;
    font-weight: bold; cursor: pointer; user-select: none;
    display: ${imgList.length > 1 ? 'block' : 'none'};
  `;
  prevBtn.onclick = () => {
    startIndex = (startIndex - 1 + imgList.length) % imgList.length;
    previewImg.src = imgBaseUrl + imgList[startIndex];
  };

  // 下一张按钮（多图时显示）
  const nextBtn = document.createElement('span');
  nextBtn.className = 'next-btn';
  nextBtn.textContent = '→';
  nextBtn.style = `
    position: absolute; right: 20px; color: #fff; font-size: 48px;
    font-weight: bold; cursor: pointer; user-select: none;
    display: ${imgList.length > 1 ? 'block' : 'none'};
  `;
  nextBtn.onclick = () => {
    startIndex = (startIndex + 1) % imgList.length;
    previewImg.src = imgBaseUrl + imgList[startIndex];
  };

  // 组装弹窗
  modal.appendChild(prevBtn);
  modal.appendChild(previewImg);
  modal.appendChild(nextBtn);
  modal.appendChild(closeBtn);
  
  // 点击弹窗外区域关闭
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  };

  // ESC键关闭
  const escClose = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', escClose);
    }
  };
  document.addEventListener('keydown', escClose);

  // 添加到页面
  document.body.appendChild(modal);
}

// ========== 加载月份行程数据 ==========
async function loadMonthEvents(year, month) {
  const monthStr = month.toString().padStart(2, '0');
  const jsonFileName = `events_${year}_${monthStr}.json`;
  if (loadedMonths[`${year}_${monthStr}`]) return;
  
  try {
    const res = await fetch(jsonFileName);
    if (!res.ok) {
      eventsData = {};
      alert(`暂无${year}年${monthStr}月的行程数据（未找到${jsonFileName}）`);
      return;
    }
    const data = await res.json();
    eventsData = typeof data === 'object' && !Array.isArray(data) ? data : {};
    loadedMonths[`${year}_${monthStr}`] = true;
  } catch (err) {
    eventsData = {};
    alert(`加载${year}年${monthStr}月行程失败：${err.message}`);
  }
}

// ========== 渲染日历 ==========
function renderCalendar(year, month) {
  const calendarGrid = document.querySelector('.calendar-grid');
  const monthTitle = document.querySelector('.month-title');
  if (!calendarGrid || !monthTitle) return;

  // 保留星期标题
  const weekdays = Array.from(calendarGrid.querySelectorAll('.weekday'));
  calendarGrid.innerHTML = '';
  weekdays.forEach(day => calendarGrid.appendChild(day));
  calendarGrid.style.display = 'grid';

  // 标题显示
  if (!month || month === '') {
    monthTitle.textContent = `${year}年`;
    return;
  }
  monthTitle.textContent = `${year}年${month}月`;

  // 计算月份天数和第一天
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // 填充空白格子
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    calendarGrid.appendChild(emptyCell);
  }

  // 填充日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.addEventListener('click', () => openDetail(dateStr));

    // 日期数字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);

    // 显示行程标签
    if (eventsData[dateStr] && eventsData[dateStr].length > 0) {
      const tagContainer = document.createElement('div');
      tagContainer.style.display = 'flex';
      tagContainer.style.flexWrap = 'wrap';
      tagContainer.style.gap = '4px';
      tagContainer.style.marginTop = '4px';

      eventsData[dateStr].forEach(event => {
        const tagInfo = getTagBgColor(event.tag);
        const eventTag = document.createElement('div');
        eventTag.className = `event-tag ${event.tag}`;
        eventTag.textContent = tagInfo.text;
        eventTag.style.backgroundColor = tagInfo.color;
        eventTag.style.color = 'white';
        eventTag.style.padding = '2px 6px';
        eventTag.style.borderRadius = '4px';
        eventTag.style.fontSize = '12px';
        tagContainer.appendChild(eventTag);
      });
      dayCell.appendChild(tagContainer);
    }

    // 标记今日
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()) {
      dayCell.classList.add('today');
    }

    calendarGrid.appendChild(dayCell);
  }
}

// ========== 初始化日期选择器 ==========
function initDaySelect() {
  const yearSel = document.getElementById('yearSelect');
  const yearSelPc = document.getElementById('yearSelect-pc');
  const monthSel = document.getElementById('monthSelect');
  const monthSelPc = document.getElementById('monthSelect-pc');
  const daySel = document.getElementById('daySelect');
  const daySelPc = document.getElementById('daySelect-pc');
  
  const currentYear = selectedYear;
  
  // 初始化年份选择器（扩展2025-2031）
  function initYearSelector(selector) {
    selector.innerHTML = '';
    for (let year = 2025; year <= 2031; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = `${year}年`;
      if (year === currentYear) option.selected = true;
      selector.appendChild(option);
    }
  }
  initYearSelector(yearSel);
  initYearSelector(yearSelPc);

  const currentMonth = selectedMonth;

  // 初始化月份选择器
  function initMonthSelector(selector, selectedVal) {
    selector.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '未选择';
    selector.appendChild(defaultOption);
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}月`;
      selector.appendChild(option);
    }
    selector.value = selectedVal === '' ? '' : selectedVal;
  }

  initMonthSelector(monthSel, currentMonth);
  initMonthSelector(monthSelPc, currentMonth);

  // 初始化日期选择器
  function initDaySelector(selector, month, selectedVal) {
    selector.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '未选择';
    selector.appendChild(defaultOption);
    if (!month || month === '') return;
    
    const daysInMonth = new Date(currentYear, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}日`;
      selector.appendChild(option);
    }
    selector.value = selectedVal === '' ? '' : selectedVal;
  }

  initDaySelector(daySel, currentMonth, selectedDay);
  initDaySelector(daySelPc, currentMonth, selectedDay);
  renderCalendar(selectedYear, selectedMonth);
}

// ========== 切换月份 ==========
function changeMonth(delta) {
  if (!selectedMonth || selectedMonth === '') {
    selectedYear += delta;
  } else {
    const newDate = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    selectedYear = newDate.getFullYear();
    selectedMonth = newDate.getMonth() + 1;
  }

  // 更新选择器值
  document.getElementById('yearSelect').value = selectedYear;
  document.getElementById('monthSelect').value = selectedMonth;
  document.getElementById('yearSelect-pc').value = selectedYear;
  document.getElementById('monthSelect-pc').value = selectedMonth;
  selectedDay = '';
  document.getElementById('daySelect').value = '';
  document.getElementById('daySelect-pc').value = '';

  // 加载对应月份数据
  if (selectedMonth !== '') loadMonthEvents(selectedYear, selectedMonth);
  
  initDaySelect();
  renderCalendar(selectedYear, selectedMonth);
  filterEventsByCategoryAndDate();
}

// ========== 绑定日期选择器事件 ==========
function bindAllDateSelectorChange() {
  // 手机端年份
  document.getElementById('yearSelect').addEventListener('change', async function() {
    selectedYear = Number(this.value);
    selectedDay = '';
    document.getElementById('yearSelect-pc').value = selectedYear;
    document.getElementById('daySelect').value = '';
    document.getElementById('daySelect-pc').value = '';
    
    if (selectedMonth !== '') await loadMonthEvents(selectedYear, selectedMonth);
    initDaySelect();
    renderCalendar(selectedYear, selectedMonth);
    filterEventsByCategoryAndDate();
  });

  // 手机端月份
  document.getElementById('monthSelect').addEventListener('change', async function() {
    selectedMonth = this.value === '' ? '' : Number(this.value);
    selectedDay = '';
    document.getElementById('monthSelect-pc').value = selectedMonth;
    document.getElementById('daySelect').value = '';
    document.getElementById('daySelect-pc').value = '';
    
    if (selectedMonth !== '') await loadMonthEvents(selectedYear, selectedMonth);
    initDaySelect();
    renderCalendar(selectedYear, selectedMonth);
    filterEventsByCategoryAndDate();
  });

  // 手机端日期
  document.getElementById('daySelect').addEventListener('change', function() {
    selectedDay = this.value === '' ? '' : String(this.value).padStart(2, '0');
    document.getElementById('daySelect-pc').value = this.value;
    filterEventsByCategoryAndDate();
  });

  // PC端年份
  document.getElementById('yearSelect-pc').addEventListener('change', async function() {
    selectedYear = Number(this.value);
    selectedDay = '';
    document.getElementById('yearSelect').value = selectedYear;
    document.getElementById('daySelect').value = '';
    document.getElementById('daySelect-pc').value = '';
    
    if (selectedMonth !== '') await loadMonthEvents(selectedYear, selectedMonth);
    initDaySelect();
    renderCalendar(selectedYear, selectedMonth);
    filterEventsByCategoryAndDate();
  });

  // PC端月份
  document.getElementById('monthSelect-pc').addEventListener('change', async function() {
    selectedMonth = this.value === '' ? '' : Number(this.value);
    selectedDay = '';
    document.getElementById('monthSelect').value = selectedMonth;
    document.getElementById('daySelect').value = '';
    document.getElementById('daySelect-pc').value = '';
    
    if (selectedMonth !== '') await loadMonthEvents(selectedYear, selectedMonth);
    initDaySelect();
    renderCalendar(selectedYear, selectedMonth);
    filterEventsByCategoryAndDate();
  });

  // PC端日期
  document.getElementById('daySelect-pc').addEventListener('change', function() {
    selectedDay = this.value === '' ? '' : String(this.value).padStart(2, '0');
    document.getElementById('daySelect').value = this.value;
    filterEventsByCategoryAndDate();
  });
}

// ========== 核心：绑定分类标签 ==========
function bindCategoryTabEvent() {
  // 定义主标签对应的子标签集合（扩展舞台/综艺/直播）
  const mainTagSubMap = {
    "打歌": ["打歌图/碎片", "打歌直拍"],
    "物料": ["图片物料", "短物料", "长物料"],
    "cha": ["队内cha", "队外cha"],
    "舞台": ["其他演出", "颁奖典礼", "演唱会"],
    "综艺": ["团综", "外务"],
    "直播": ["团体直播", "个人直播", "多人直播"],
    "全部动态": [
      "打歌图/碎片", "打歌直拍", "图片物料", "短物料", "长物料", 
      "队内cha", "队外cha", "舞台", "其他演出", "颁奖典礼", "演唱会",
      "综艺", "团综", "外务", "直播", "团体直播", "个人直播", "多人直播",
      "回归日程", "猫言猫语"
    ]
  };

  // 1. 绑定下拉菜单触发按钮
  document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const dropdownContent = this.nextElementSibling;
      if (dropdownContent && dropdownContent.classList.contains('dropdown-content')) {
        document.querySelectorAll('.dropdown-content').forEach(content => {
          if (content !== dropdownContent) content.style.display = 'none';
        });
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
      }
      
      document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.dataset.target.trim();
      filterEventsByCategoryAndDate();
    });
  });

  // 2. 绑定子标签点击事件
  document.querySelectorAll('.subtab').forEach(subtab => {
    subtab.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const subTagTarget = this.dataset.target.trim();
      const mainBtn = this.closest('.dropdown').querySelector('.dropdown-btn');

      document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      mainBtn.classList.add('active');

      activeCategory = subTagTarget;
      filterEventsByCategoryAndDate();
    });
  });

  // 3. 绑定普通主标签
  document.querySelectorAll('.tab').forEach(tab => {
    if (!tab.classList.contains('dropdown-btn')) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-content').forEach(content => {
          content.style.display = 'none';
        });
        
        document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        activeCategory = this.dataset.target.trim();
        filterEventsByCategoryAndDate();
      });
    }
  });

  // 4. 点击空白处关闭菜单
  document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-content').forEach(content => {
      content.style.display = 'none';
    });
  });
}

// ========== 筛选行程 ==========
function filterEventsByCategoryAndDate() {
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  let filterResult = [];

  // 主标签-子标签映射（扩展版）
  const mainTagSubMap = {
    "打歌": ["打歌图/碎片", "打歌直拍"],
    "物料": ["图片物料", "短物料", "长物料"],
    "cha": ["队内cha", "队外cha"],
    "舞台": ["其他演出", "颁奖典礼", "演唱会"],
    "综艺": ["团综", "外务"],
    "直播": ["团体直播", "个人直播", "多人直播"],
    "全部动态": [
      "打歌图/碎片", "打歌直拍", "图片物料", "短物料", "长物料", 
      "队内cha", "队外cha", "舞台", "其他演出", "颁奖典礼", "演唱会",
      "综艺", "团综", "外务", "直播", "团体直播", "个人直播", "多人直播",
      "回归日程", "猫言猫语"
    ]
  };

  // 遍历筛选
  for (const [dateStr, eventList] of Object.entries(eventsData)) {
    const [y, m, d] = dateStr.split('-');
    const yNum = Number(y);
    const mNum = Number(m);
    const dStr = d;

    for (const event of eventList) {
      // 分类匹配
      let categoryMatch = false;
      if (mainTagSubMap[activeCategory]) {
        categoryMatch = mainTagSubMap[activeCategory].includes(event.tag);
      } else {
        categoryMatch = event.tag === activeCategory;
      }

      // 时间匹配
      let timeMatch;
      if (!selectedMonth && !selectedDay) {
        timeMatch = yNum === selectedYear;
      } else if (!selectedMonth && selectedDay) {
        timeMatch = yNum === selectedYear && dStr === selectedDay;
      } else if (selectedMonth && !selectedDay) {
        timeMatch = yNum === selectedYear && mNum === selectedMonth;
      } else {
        timeMatch = yNum === selectedYear && mNum === selectedMonth && dStr === selectedDay;
      }

      if (categoryMatch && timeMatch) {
        filterResult.push({ dateStr, month: mNum, day: dStr, event });
      }
    }
  }

  // 排序渲染
  filterResult.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  if (filterResult.length === 0) {
    eventsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无相关行程</div>';
  } else {
    if (!selectedMonth && !selectedDay) {
      const groupedByMonth = {};
      filterResult.forEach(item => {
        if (!groupedByMonth[item.month]) {
          groupedByMonth[item.month] = [];
        }
        groupedByMonth[item.month].push(item);
      });

      for (let month = 1; month <= 12; month++) {
        const monthItems = groupedByMonth[month];
        if (monthItems && monthItems.length > 0) {
          const monthTitle = document.createElement('div');
          monthTitle.style.cssText = 'font-size:18px; font-weight:600; color:#6a4c93; margin:20px 0 10px 0; padding-left:8px; border-left:4px solid #b088c8;';
          monthTitle.textContent = `${selectedYear}年${month}月`;
          eventsList.appendChild(monthTitle);

          monthItems.forEach(item => {
            eventsList.innerHTML += renderEventCard(item.dateStr, item.event);
          });
        }
      }
    } else {
      filterResult.forEach(item => {
        eventsList.innerHTML += renderEventCard(item.dateStr, item.event);
      });
    }
  }

  document.querySelector('.events-panel').classList.add('active');
  updateEventsPanelTitle();
}

// ========== 打开行程详情 ==========
function openDetail(dateStr) {
  const eventList = eventsData[dateStr] || [];
  const date = new Date(dateStr);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];

  document.getElementById('eventsDateTitle').textContent = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${weekday}`;
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';

  if (eventList.length === 0) {
    eventsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无相关行程</div>';
  } else {
    eventList.forEach(event => {
      eventsList.innerHTML += renderEventCard(dateStr, event);
    });
  }

  document.querySelector('.events-panel').classList.add('active');
}

// ========== 关闭行程面板 ==========
function closeEventsPanel() {
  document.querySelector('.events-panel').classList.remove('active');
}

// ========== 更新面板标题 ==========
function updateEventsPanelTitle() {
  const titleEl = document.getElementById('eventsDateTitle');
  let timeTitle = '';
  let categoryTitle = activeCategory;

  // 优化主标签标题
  const mainTagAlias = {
    "打歌": "打歌（打歌图/碎片+打歌直拍）",
    "物料": "物料（图片物料+短物料+长物料）",
    "cha": "cha（队内cha+队外cha）",
    "舞台": "舞台（其他演出+颁奖典礼+演唱会）",
    "综艺": "综艺（团综+外务）",
    "直播": "直播（团体直播+个人直播+多人直播）"
  };
  if (mainTagAlias[categoryTitle]) {
    categoryTitle = mainTagAlias[categoryTitle];
  }

  // 时间标题
  if (!selectedMonth && !selectedDay) {
    timeTitle = `${selectedYear}年`;
  } else if (!selectedMonth && selectedDay) {
    timeTitle = `${selectedYear}年 每月${selectedDay}日`;
  } else if (selectedMonth && !selectedDay) {
    timeTitle = `${selectedYear}年${selectedMonth}月`;
  } else {
    timeTitle = `${selectedYear}年${selectedMonth}月${selectedDay}日`;
  }

  titleEl.textContent = `${timeTitle} · ${categoryTitle}`;
}

// ========== 标签颜色映射（扩展版） ==========
function getTagBgColor(tag) {
  const colorMap = {
    // 原有标签
    "打歌图/碎片": { color: "#f2a950", text: "打歌图/碎片" },
    "打歌直拍": { color: "#e67e22", text: "打歌直拍" },
    "图片物料": { color: "#34D399", text: "图片物料" },
    "短物料": { color: "#059669", text: "短物料" },
    "长物料": { color: "#065F46", text: "长物料" },
    "队内cha": { color: "#EF9A9A", text: "队内cha" },
    "队外cha": { color: "#FFCDD2", text: "队外cha" },
    "舞台": { color: "#ff6b8b", text: "舞台" },
    "综艺": { color: "#7e57c2", text: "综艺" },
    "直播": { color: "#ef5350", text: "直播" },
    "回归日程": { color: "#42a5f5", text: "回归日程" },
    "猫言猫语": { color: "#ab47bc", text: "猫言猫语" },
    
    // 新增舞台子标签（粉色系）
    "其他演出": { color: "#ff8fa3", text: "其他演出" },
    "颁奖典礼": { color: "#ff527b", text: "颁奖典礼" },
    "演唱会": { color: "#d63031", text: "演唱会" },
    
    // 新增综艺子标签（紫色系）
    "团综": { color: "#9575cd", text: "团综" },
    "外务": { color: "#673ab7", text: "外务" },
    
    // 新增直播子标签（红色系）
    "团体直播": { color: "#e57373", text: "团体直播" },
    "个人直播": { color: "#f44336", text: "个人直播" },
    "多人直播": { color: "#d32f2f", text: "多人直播" }
  };
  return colorMap[tag] || { color: "#6b77e5", text: tag };
}

// ========== 初始化页面 ==========
window.onload = async function() {
  // 初始化选择器值
  selectedYear = Number(document.getElementById('yearSelect').value) || 2026;
  selectedMonth = document.getElementById('monthSelect').value;
  selectedMonth = selectedMonth === '' ? '' : Number(selectedMonth);
  selectedDay = '';
  document.getElementById('yearSelect-pc').value = selectedYear;
  document.getElementById('monthSelect-pc').value = selectedMonth;
  document.getElementById('daySelect-pc').value = selectedDay;

  // 加载默认月份数据
  if (selectedMonth === '') {
    await loadMonthEvents(selectedYear, 2); // 默认加载2月
  } else {
    await loadMonthEvents(selectedYear, selectedMonth);
  }

  // 初始化
  renderCalendar(selectedYear, selectedMonth);
  initDaySelect();
  bindCategoryTabEvent();
  bindAllDateSelectorChange();
  filterEventsByCategoryAndDate();
};

// 移动端下拉菜单强制显示逻辑
document.addEventListener('DOMContentLoaded', function() {
  if (window.innerWidth <= 768) {
    // 移除移动端原有舞台/综艺/直播主标签，替换为子标签
    const mobileTabContainer = document.querySelector('.mobile-category-tabs');
    if (mobileTabContainer) {
      // 移除旧标签
      const oldTags = mobileTabContainer.querySelectorAll('.tab[data-target="舞台"], .tab[data-target="综艺"], .tab[data-target="直播"]');
      oldTags.forEach(tag => tag.remove());
      
      // 添加舞台子标签
      const stageSubTags = ["其他演出", "颁奖典礼", "演唱会"];
      stageSubTags.forEach(tagName => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.target = tagName;
        tab.textContent = tagName;
        mobileTabContainer.appendChild(tab);
      });
      
      // 添加综艺子标签
      const varietySubTags = ["团综", "外务"];
      varietySubTags.forEach(tagName => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.target = tagName;
        tab.textContent = tagName;
        mobileTabContainer.appendChild(tab);
      });
      
      // 添加直播子标签
      const liveSubTags = ["团体直播", "个人直播", "多人直播"];
      liveSubTags.forEach(tagName => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.target = tagName;
        tab.textContent = tagName;
        mobileTabContainer.appendChild(tab);
      });
    }

    // 给所有移动端下拉菜单的主标签绑定点击事件
    document.querySelectorAll('.mobile-dropdown .dropdown-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        // 关闭其他所有下拉菜单
        document.querySelectorAll('.mobile-dropdown .dropdown-content').forEach(content => {
          content.style.display = 'none';
        });
        // 显示当前下拉菜单
        const dropdownContent = this.nextElementSibling;
        if (dropdownContent) {
          dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        }
      });
    });

    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.mobile-dropdown')) {
        document.querySelectorAll('.mobile-dropdown .dropdown-content').forEach(content => {
          content.style.display = 'none';
        });
      }
    });
  } else {
    // PC端添加舞台/综艺/直播下拉菜单
    const pcDropdownContainer = document.querySelector('.pc-dropdowns');
    if (pcDropdownContainer) {
      // 舞台下拉
      const stageDropdown = document.createElement('div');
      stageDropdown.className = 'dropdown pc-dropdown';
      stageDropdown.innerHTML = `
        <div class="tab dropdown-btn" data-target="舞台">舞台</div>
        <div class="dropdown-content">
          <div class="subtab" data-target="其他演出">其他演出</div>
          <div class="subtab" data-target="颁奖典礼">颁奖典礼</div>
          <div class="subtab" data-target="演唱会">演唱会</div>
        </div>
      `;
      pcDropdownContainer.appendChild(stageDropdown);
      
      // 综艺下拉
      const varietyDropdown = document.createElement('div');
      varietyDropdown.className = 'dropdown pc-dropdown';
      varietyDropdown.innerHTML = `
        <div class="tab dropdown-btn" data-target="综艺">综艺</div>
        <div class="dropdown-content">
          <div class="subtab" data-target="团综">团综</div>
          <div class="subtab" data-target="外务">外务</div>
        </div>
      `;
      pcDropdownContainer.appendChild(varietyDropdown);
      
      // 直播下拉
      const liveDropdown = document.createElement('div');
      liveDropdown.className = 'dropdown pc-dropdown';
      liveDropdown.innerHTML = `
        <div class="tab dropdown-btn" data-target="直播">直播</div>
        <div class="dropdown-content">
          <div class="subtab" data-target="团体直播">团体直播</div>
          <div class="subtab" data-target="个人直播">个人直播</div>
          <div class="subtab" data-target="多人直播">多人直播</div>
        </div>
      `;
      pcDropdownContainer.appendChild(liveDropdown);
      
      // PC端hover事件
      document.querySelectorAll('.pc-dropdown').forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
          this.querySelector('.dropdown-content').style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', function() {
          this.querySelector('.dropdown-content').style.display = 'none';
        });
      });
      
      // PC端子标签点击事件
      document.querySelectorAll('.pc-dropdown .subtab').forEach(subtab => {
        subtab.addEventListener('click', function(e) {
          e.stopPropagation();
          document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
          this.classList.add('active');
          this.closest('.pc-dropdown').querySelector('.tab').classList.add('active');
          activeCategory = this.dataset.target.trim();
          filterEventsByCategoryAndDate();
          this.closest('.dropdown-content').style.display = 'none';
        });
      });
    }
  }
});

// ========== 移动端平铺标签绑定（仅新增，不改动原有逻辑） ==========
document.addEventListener('DOMContentLoaded', function() {
    // 1. 移动端标签点击绑定
    const mobileTabs = document.querySelectorAll('.mobile-category-tabs .tab');
    mobileTabs.forEach(tab => {
        // PC端click事件
        tab.addEventListener('click', function() {
            // 移除所有标签激活态
            document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
            // 激活当前移动端标签
            this.classList.add('active');
            // 设置筛选分类并刷新
            activeCategory = this.dataset.target.trim();
            filterEventsByCategoryAndDate();
        });

        // 移动端touch事件（解决300ms延迟）
        tab.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            this.click(); // 触发click事件，复用筛选逻辑
        });
    });

    // 2. 保留PC端下拉菜单hover触发（原有逻辑）
    const pcDropdowns = document.querySelectorAll('.pc-dropdown');
    pcDropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-content').style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-content').style.display = 'none';
        });
    });

    // 3. PC端子标签点击绑定（原有逻辑）
    const pcSubtabs = document.querySelectorAll('.subtab');
    pcSubtabs.forEach(subtab => {
        subtab.addEventListener('click', function() {
            document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            this.closest('.dropdown').querySelector('.tab').classList.add('active');
            activeCategory = this.dataset.target.trim();
            filterEventsByCategoryAndDate();
        });
    });
});

// ========== 强制恢复PC端子标签点击事件 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 1. 给所有PC端子标签重新绑定点击事件
    const pcSubtabs = document.querySelectorAll('.pc-dropdown .subtab');
    pcSubtabs.forEach(subtab => {
        // 先移除原有事件，避免冲突
        subtab.removeEventListener('click', handleSubtabClick);
        // 重新绑定最基础的点击事件
        subtab.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡关闭菜单
            e.preventDefault();
            
            // 1. 激活当前子标签+对应主标签
            document.querySelectorAll('.tab, .subtab').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            this.closest('.pc-dropdown').querySelector('.tab').classList.add('active');
            
            // 2. 设置筛选分类并刷新
            activeCategory = this.dataset.target.trim();
            filterEventsByCategoryAndDate();
            
            // 3. 可选：点击后关闭下拉菜单（体验优化）
            this.closest('.dropdown-content').style.display = 'none';
        });
    });

    // 2. 确保PC端主标签点击也能生效
    const pcMainTabs = document.querySelectorAll('.category-tabs .tab:not(.dropdown-btn)');
    pcMainTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab, .subtab').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            activeCategory = this.dataset.target.trim();
            filterEventsByCategoryAndDate();
        });
    });
});

// 兼容处理函数（避免报错）
function handleSubtabClick() {}