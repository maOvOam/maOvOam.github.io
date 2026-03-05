// 全局缓存：每个月只加载一次
let currentDate = new Date();
let activeCategory = '全部动态';
let selectedYear = currentDate.getFullYear(); // 默认当前年份
let selectedMonth = currentDate.getMonth() + 1; // 默认当前月份（1-12）
let selectedDay = '';
let eventsData = {};
let loadedMonths = {};

// 工具：补0
function monthStr(n) {
  return String(n).padStart(2, '0');
}

// 标签颜色 - cha 统一浅香芋紫 #A895E7
function getTagBgColor(tag) {
  const map = {
    "打歌图/碎片": { color: "#f2a950", text: "打歌图/碎片" },
    "打歌直拍": { color: "#e67e22", text: "打歌直拍" },
    "打歌小游戏": { color: "#e67e22", text: "打歌小游戏" },
    "图片物料": { color: "#34D990", text: "图片物料" },
    "短物料": { color: "#059669", text: "短物料" },
    "长物料": { color: "#065F46", text: "长物料" },
    "队内cha": { color: "#A895E7", text: "队内cha" },
    "队外cha": { color: "#A895E7", text: "队外cha" },
    "舞台": { color: "#ff6b8b", text: "舞台" },
    "综艺": { color: "#7e57c2", text: "综艺" },
    "直播": { color: "#ef5350", text: "直播" },
    "回归日程": { color: "#42a9f5", text: "回归日程" },
    "猫言猫语": { color: "#ab47bc", text: "猫言猫语" },
    "饲养员日记": { color: "#FFB7C5", text: "饲养员日记" },
    "其他演出": { color: "#ff8fa3", text: "其他演出" },
    "颁奖典礼": { color: "#ff527b", text: "颁奖典礼" },
    "演唱会": { color: "#d0331e", text: "演唱会" },
    "团综": { color: "#9575cd", text: "团综" },
    "外务": { color: "#673ab7", text: "外务" },
    "团体直播": { color: "#e57373", text: "团体直播" },
    "个人直播": { color: "#f44336", text: "个人直播" },
    "多人直播": { color: "#d32f2e", text: "多人直播" }
  };
  return map[tag] || { color: "#6b77e5", text: tag };
}

// 多图预览
function openImgPreview(imgsJson, startIndex) {
  const imgList = JSON.parse(imgsJson);
  let current = startIndex;
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:999999;display:flex;align-items:center;justify-content:center;";
  
  const img = document.createElement('img');
  img.style.cssText = "max-width:90%;max-height:90%;object-fit:contain;";
  img.src = imgList[current];

  const close = document.createElement('div');
  close.innerText = '×';
  close.style.cssText = "position:fixed;top:20px;right:20px;font-size:40px;color:#fff;cursor:pointer;z-index:9999999;";
  close.onclick = () => modal.remove();

  if (imgList.length > 1) {
    const left = document.createElement('div');
    left.innerText = '←';
    left.style.cssText = "position:fixed;left:20px;top:50%;transform:translateY(-50%);font-size:50px;color:#fff;cursor:pointer;z-index:9999999;";
    left.onclick = () => {
      current = (current - 1 + imgList.length) % imgList.length;
      img.src = imgList[current];
    };

    const right = document.createElement('div');
    right.innerText = '→';
    right.style.cssText = "position:fixed;right:20px;top:50%;transform:translateY(-50%);font-size:50px;color:#fff;cursor:pointer;z-index:9999999;";
    right.onclick = () => {
      current = (current + 1) % imgList.length;
      img.src = imgList[current];
    };

    modal.append(left, right);
  }

  modal.append(img, close);
  modal.onclick = e => e.target === modal && modal.remove();
  document.body.append(modal);
}

// 渲染单条行程（给标题添加专属类 event-title-text）
function renderEventCard(dateStr, event) {
  const [year, month, day] = dateStr.split('-');
  const tagInfo = getTagBgColor(event.tag);
  const dayNum = day.padStart(2, '0');

  const imgBaseUrl = "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/";
  const defaultImg = "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/20260201Figaro.jpg";

  let imgList = [];
  if (Array.isArray(event.image)) {
    imgList = event.image.filter(Boolean).map(img => 
      img.startsWith('http') ? img : imgBaseUrl + img
    );
  } else if (event.image) {
    imgList = [event.image.startsWith('http') ? event.image : imgBaseUrl + event.image];
  }

  let imgHtml = '';
  if (imgList.length > 0) {
    imgHtml = `
    <div style="width:80px;height:80px;border-radius:8px;overflow:hidden;position:relative;">
      <img 
        src="${imgList[0]}" 
        class="event-img" 
        data-imgs='${JSON.stringify(imgList)}' 
        style="width:100%;height:100%;object-fit:cover;cursor:pointer;"
        onclick="openImgPreview(this.dataset.imgs,0);return false;">
      ${imgList.length > 1 ? `<div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:white;font-size:10px;padding:1px 4px;border-radius:3px;">${imgList.length}张</div>` : ''}
    </div>`;
  } else {
    imgHtml = `
    <div style="width:80px;height:80px;border-radius:8px;overflow:hidden;">
      <img src="${defaultImg}" style="width:100%;height:100%;object-fit:cover;">
    </div>`;
  }

  const titleHtml = event.link 
    ? `<a href="${event.link}" target="_blank" style="color:inherit;text-decoration:none;">${event.title}</a>` 
    : event.title;

  return `
  <div class="event-card" data-category="${event.tag}" data-title="${event.title}" data-desc="${event.time || ''}" style="background:${tagInfo.color};border-radius:16px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;color:#fff;font-family:微软雅黑,sans-serif;">
    <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">
      ${dayNum}
    </div>
    <div style="flex:1;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="background:rgba(255,255,255,0.2);border-radius:4px;padding:3px 8px;font-size:12px;font-weight:600;">${tagInfo.text}</div>
        <div class="event-title-text" style="font-size:16px;font-weight:bold;flex:1;min-width:100px;">${titleHtml}</div>
      </div>
      <div style="font-size:12px;opacity:0.8;margin-top:4px;">
        ${year}年${month}月${day}日 ${event.time || ''}
      </div>
    </div>
    ${imgHtml}
  </div>`;
}

// 加载单个月份数据
async function loadMonthEvents(year, month) {
  const m = monthStr(month);
  const key = `${year}_${m}`;
  if (loadedMonths[key]) return;
  try {
    const res = await fetch(`events_${year}_${m}.json`);
    if (!res.ok) { 
      eventsData[key] = {}; // 无数据时初始化空对象
      loadedMonths[key] = true; 
      return; 
    }
    const monthData = await res.json();
    // 合并到全局eventsData中（避免覆盖其他月份）
    eventsData = { ...eventsData, ...monthData };
    loadedMonths[key] = true;
  } catch (err) {
    eventsData[key] = {};
    loadedMonths[key] = true;
    console.warn(`加载${year}年${month}月数据失败:`, err);
  }
}

// 预加载全年12个月的数据
async function loadFullYearData(year) {
  for (let month = 1; month <= 12; month++) {
    await loadMonthEvents(year, month);
  }
}

// 渲染日历
function renderCalendar(year, month) {
  const calendarGrid = document.querySelector('.calendar-grid');
  const monthTitle = document.querySelector('.month-title');
  if (!calendarGrid || !monthTitle) return;

  const weekdays = Array.from(calendarGrid.querySelectorAll('.weekday'));
  calendarGrid.innerHTML = '';
  weekdays.forEach(el => calendarGrid.appendChild(el));

  if (!month) {
    monthTitle.textContent = `${year}年`;
    return;
  }
  monthTitle.textContent = `${year}年${month}月`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const c = document.createElement('div');
    c.className = 'day-cell empty';
    calendarGrid.appendChild(c);
  }

  const today = new Date();
  const isToday = d => 
    year === today.getFullYear() 
    && month === today.getMonth() + 1 
    && d === today.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${monthStr(month)}-${monthStr(day)}`;
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.onclick = () => openDetail(dateStr);

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = day;
    cell.appendChild(num);

    // 检查该日期是否有行程
    if (eventsData[dateStr] && Object.keys(eventsData[dateStr]).length > 0) {
      const tagContainer = document.createElement('div');
      tagContainer.style.display = 'flex';
      tagContainer.style.flexWrap = 'wrap';
      tagContainer.style.gap = '4px';
      tagContainer.style.marginTop = '4px';

      Object.values(eventsData[dateStr]).forEach(event => {
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
      cell.appendChild(tagContainer);
    }

    if (isToday(day)) cell.classList.add('today');
    calendarGrid.appendChild(cell);
  }
}

// 初始化下拉框
function initDaySelect() {
  const ys = document.getElementById('yearSelect');
  const ysp = document.getElementById('yearSelect-pc');
  const ms = document.getElementById('monthSelect');
  const msp = document.getElementById('monthSelect-pc');
  const ds = document.getElementById('daySelect');
  const dsp = document.getElementById('daySelect-pc');
  if (!ys || !ms || !ds) return;

  // 构建年份下拉框
  function buildYear(s) {
    s.innerHTML = '';
    // 显示近5年
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 3; y++) {
      const o = document.createElement('option');
      o.value = y;
      o.textContent = y + '年';
      if (y === selectedYear) o.selected = true;
      s.appendChild(o);
    }
  }
  buildYear(ys);
  buildYear(ysp);

  // 构建月份下拉框
  function buildMonth(s, val) {
    s.innerHTML = '<option value="">未选择</option>';
    for (let i = 1; i <= 12; i++) {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i + '月';
      s.appendChild(o);
    }
    s.value = val;
  }
  buildMonth(ms, selectedMonth);
  buildMonth(msp, selectedMonth);

  // 构建日期下拉框
  function buildDay(s, m, val) {
    s.innerHTML = '<option value="">未选择</option>';
    if (!m) return;
    const max = new Date(selectedYear, m, 0).getDate();
    for (let i = 1; i <= max; i++) {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i + '日';
      s.appendChild(o);
    }
    s.value = val;
  }
  buildDay(ds, selectedMonth, selectedDay);
  buildDay(dsp, selectedMonth, selectedDay);

  renderCalendar(selectedYear, selectedMonth);
}

// 月份切换
function changeMonth(delta) {
  if (!selectedMonth) {
    selectedYear += delta;
  } else {
    const nd = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    selectedYear = nd.getFullYear();
    selectedMonth = nd.getMonth() + 1;
  }

  document.getElementById('yearSelect').value = selectedYear;
  document.getElementById('monthSelect').value = selectedMonth;
  document.getElementById('yearSelect-pc').value = selectedYear;
  document.getElementById('monthSelect-pc').value = selectedMonth;
  selectedDay = '';
  document.getElementById('daySelect').value = '';
  document.getElementById('daySelect-pc').value = '';

  // 加载切换后的月份数据
  loadMonthEvents(selectedYear, selectedMonth).then(() => {
    initDaySelect();
    filterEventsByCategoryAndDate();
    filterEventsBySearch();
  });
}

// 绑定下拉框事件
function bindAllDateSelectorChange() {
  const ys = document.getElementById('yearSelect');
  const ms = document.getElementById('monthSelect');
  const ds = document.getElementById('daySelect');
  const ysp = document.getElementById('yearSelect-pc');
  const msp = document.getElementById('monthSelect-pc');
  const dsp = document.getElementById('daySelect-pc');

  // 年份选择事件
  async function onYearChange() {
    selectedYear = Number(this.value);
    selectedDay = '';
    ysp.value = selectedYear;
    ds.value = '';
    dsp.value = '';

    // 如果未选月份（全年），加载全年数据；否则加载当前月份
    if (!selectedMonth) {
      await loadFullYearData(selectedYear);
    } else {
      await loadMonthEvents(selectedYear, selectedMonth);
    }

    initDaySelect();
    filterEventsByCategoryAndDate();
    filterEventsBySearch();
  }

  // 月份选择事件
  async function onMonthChange() {
    selectedMonth = this.value ? Number(this.value) : '';
    selectedDay = '';
    msp.value = selectedMonth;
    ds.value = '';
    dsp.value = '';

    // 取消月份选择（全年）→ 加载全年数据；选了月份 → 加载对应月份
    if (!selectedMonth) {
      await loadFullYearData(selectedYear);
    } else {
      await loadMonthEvents(selectedYear, selectedMonth);
    }

    initDaySelect();
    filterEventsByCategoryAndDate();
    filterEventsBySearch();
  }

  // 日期选择事件
  function onDayChange() {
    selectedDay = this.value ? monthStr(this.value) : '';
    dsp.value = this.value;
    filterEventsByCategoryAndDate();
    filterEventsBySearch();
  }

  // 绑定事件
  ys.addEventListener('change', onYearChange);
  ysp.addEventListener('change', onYearChange);
  ms.addEventListener('change', onMonthChange);
  msp.addEventListener('change', onMonthChange);
  ds.addEventListener('change', onDayChange);
  dsp.addEventListener('change', onDayChange);
}

// 绑定分类标签事件
function bindCategoryTabEvent() {
  const categoryMap = {
    "打歌": ["打歌图/碎片","打歌直拍","打歌小游戏"],
    "物料": ["图片物料","短物料","长物料"],
    "cha": ["队内cha","队外cha"],
    "舞台": ["其他演出","颁奖典礼","演唱会"],
    "综艺": ["团综","外务"],
    "直播": ["团体直播","个人直播","多人直播"],
    "全部动态": ["打歌图/碎片","打歌直拍","打歌小游戏","图片物料","短物料","长物料","队内cha","队外cha","舞台","其他演出","颁奖典礼","演唱会","综艺","团综","外务","直播","团体直播","个人直播","多人直播","回归日程","猫言猫语","饲养员日记"]
  };

  document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const content = btn.nextElementSibling;
      if (!content) return;
      document.querySelectorAll('.dropdown-content').forEach(x => x !== content && (x.style.display = 'none'));
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
      document.querySelectorAll('.tab,.subtab').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.target.trim();
      filterEventsByCategoryAndDate();
      filterEventsBySearch();
    };
  });

  document.querySelectorAll('.subtab').forEach(st => {
    st.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll('.tab,.subtab').forEach(x => x.classList.remove('active'));
      st.classList.add('active');
      const p = st.closest('.dropdown');
      if (p) p.querySelector('.dropdown-btn')?.classList.add('active');
      activeCategory = st.dataset.target.trim();
      filterEventsByCategoryAndDate();
      filterEventsBySearch();
    };
  });

  document.querySelectorAll('.tab:not(.dropdown-btn)').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.dropdown-content').forEach(x => x.style.display = 'none');
      document.querySelectorAll('.tab,.subtab').forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.target.trim();
      filterEventsByCategoryAndDate();
      filterEventsBySearch();
    };
  });

  document.onclick = () => {
    document.querySelectorAll('.dropdown-content').forEach(x => x.style.display = 'none');
  };
}

// 绑定搜索框事件
function bindSearchEvent() {
  const searchInput = document.getElementById('scheduleSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', filterEventsBySearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterEventsBySearch();
    }
  });
}

// 核心：仅匹配行程标题的搜索逻辑
function filterEventsBySearch() {
  const searchInput = document.getElementById('scheduleSearchInput');
  if (!searchInput) return;
  
  const searchText = searchInput.value.trim().toLowerCase();
  const eventCards = document.querySelectorAll('.event-card');
  
  const calendarNav = document.querySelector('.calendar-nav');
  const calendarGrid = document.querySelector('.calendar-grid');
  
  // 清空搜索：恢复所有行程和日历
  if (!searchText) {
    eventCards.forEach(card => {
      card.classList.remove('hidden');
      card.style.display = 'flex';
    });
    if (calendarNav) calendarNav.style.display = 'flex';
    if (calendarGrid) calendarGrid.style.display = 'grid';
    return;
  }
  
  // 有搜索关键词：仅显示标题匹配的行程，隐藏日历
  eventCards.forEach(card => {
    const titleElement = card.querySelector('.event-title-text');
    if (!titleElement) {
      card.classList.add('hidden');
      card.style.display = 'none';
      return;
    }
    
    const titleText = titleElement.textContent.toLowerCase().trim();
    const isMatch = titleText.includes(searchText);
    
    if (isMatch) {
      card.classList.remove('hidden');
      card.style.display = 'flex';
    } else {
      card.classList.add('hidden');
      card.style.display = 'none';
    }
  });
  
  if (calendarNav) calendarNav.style.display = 'none';
  if (calendarGrid) calendarGrid.style.display = 'none';
}

// 筛选并渲染行程列表
function filterEventsByCategoryAndDate() {
  const listEl = document.getElementById('eventsList');
  if (!listEl) return;
  listEl.innerHTML = '';

  const categoryMap = {
    "打歌": ["打歌图/碎片","打歌直拍","打歌小游戏"],
    "物料": ["图片物料","短物料","长物料"],
    "cha": ["队内cha","队外cha"],
    "舞台": ["其他演出","颁奖典礼","演唱会"],
    "综艺": ["团综","外务"],
    "直播": ["团体直播","个人直播","多人直播"],
    "全部动态": ["打歌图/碎片","打歌直拍","打歌小游戏","图片物料","短物料","长物料","队内cha","队外cha","舞台","其他演出","颁奖典礼","演唱会","综艺","团综","外务","直播","团体直播","个人直播","多人直播","回归日程","猫言猫语","饲养员日记"]
  };

  const list = [];
  // 遍历所有已加载的日期数据
  for (const [dateStr, events] of Object.entries(eventsData)) {
    if (!events || typeof events !== 'object') continue;
    
    const [y, m, d] = dateStr.split('-');
    const yNum = Number(y), mNum = Number(m);
    
    // 遍历该日期下的所有行程
    Object.values(events).forEach(e => {
      // 分类筛选
      const okTag = categoryMap[activeCategory] 
        ? categoryMap[activeCategory].includes(e.tag) 
        : e.tag === activeCategory;

      // 日期筛选逻辑
      const okDate = 
        // 仅选年份 → 匹配全年
        (!selectedMonth && !selectedDay && yNum === selectedYear)
        // 选年份+月份 → 匹配当月
        || (selectedMonth && !selectedDay && yNum === selectedYear && mNum === selectedMonth)
        // 选年份+月份+日期 → 匹配当日
        || (selectedMonth && selectedDay && yNum === selectedYear && mNum === selectedMonth && d === selectedDay);

      if (okTag && okDate) {
        list.push({ dateStr, m: mNum, d, e });
      }
    });
  }

  // 按日期排序
  list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  // 无数据提示
  if (!list.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:30px 10px;color:#999;">暂无相关行程</div>';
    return;
  }

  // 按月份分组显示（仅全年视图）
  if (!selectedMonth) {
    const monthGroups = {};
    list.forEach(item => {
      const monthKey = item.m;
      if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
      monthGroups[monthKey].push(item);
    });

    // 按月份顺序渲染
    for (let month = 1; month <= 12; month++) {
      if (monthGroups[month]) {
        // 月份标题
        const monthTitle = document.createElement('div');
        monthTitle.style.cssText = 'font-size:18px;font-weight:600;color:#6a4c93;margin:24px 0 12px 0;padding-left:8px;border-left:4px solid #b08cff;';
        monthTitle.textContent = `${selectedYear}年${month}月`;
        listEl.appendChild(monthTitle);

        // 渲染该月行程
        monthGroups[month].forEach(item => {
          listEl.innerHTML += renderEventCard(item.dateStr, item.e);
        });
      }
    }
  } else {
    // 月份/日期视图：直接渲染
    list.forEach(item => {
      listEl.innerHTML += renderEventCard(item.dateStr, item.e);
    });
  }

  const panel = document.querySelector('.events-panel');
  if (panel) panel.classList.add('active');
  updateTitle();
}

// 更新页面标题
function updateTitle() {
  const titleEl = document.getElementById('eventsDateTitle');
  if (!titleEl) return;
  
  let timeText = '';
  if (!selectedMonth && !selectedDay) {
    timeText = `${selectedYear}年`;
  } else if (selectedMonth && !selectedDay) {
    timeText = `${selectedYear}年${selectedMonth}月`;
  } else if (selectedMonth && selectedDay) {
    timeText = `${selectedYear}年${selectedMonth}月${selectedDay}日`;
  }

  const categoryAlias = {
    "打歌": "打歌（打歌图/碎片+打歌直拍+打歌小游戏）",
    "物料": "物料（图片物料+短物料+长物料）",
    "cha": "cha（队内cha+队外cha）",
    "舞台": "舞台（其他演出+颁奖典礼+演唱会）",
    "综艺": "综艺（团综+外务）",
    "直播": "直播（团体直播+个人直播+多人直播）"
  };
  const categoryText = categoryAlias[activeCategory] || activeCategory;
  
  titleEl.textContent = `${timeText} · ${categoryText}`;
}

// 打开日期详情
function openDetail(dateStr) {
  const events = eventsData[dateStr] || {};
  const [year, month, day] = dateStr.split('-');
  const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
  const weekDay = weekDays[new Date(dateStr).getDay()];
  
  // 更新标题
  const titleEl = document.getElementById('eventsDateTitle');
  if (titleEl) {
    titleEl.textContent = `${year}年${month}月${day}日 ${weekDay} · ${activeCategory}`;
  }

  // 渲染行程列表
  const listEl = document.getElementById('eventsList');
  if (!listEl) return;
  
  if (Object.keys(events).length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">暂无行程</div>';
  } else {
    listEl.innerHTML = '';
    Object.values(events).forEach(event => {
      listEl.innerHTML += renderEventCard(dateStr, event);
    });
  }

  const panel = document.querySelector('.events-panel');
  if (panel) panel.classList.add('active');
  
  // 保持搜索状态
  filterEventsBySearch();
}

// 关闭行程面板
function closeEventsPanel() {
  const panel = document.querySelector('.events-panel');
  if (panel) panel.classList.remove('active');
}

// 初始化函数
async function init() {
  await new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  });

  // 获取当前日期，默认显示当月
  const today = new Date();
  selectedYear = today.getFullYear();
  selectedMonth = today.getMonth() + 1;
  selectedDay = '';

  // 加载当前月份数据
  await loadMonthEvents(selectedYear, selectedMonth);
  
  // 初始化UI和事件
  renderCalendar(selectedYear, selectedMonth);
  initDaySelect();
  bindCategoryTabEvent();
  bindAllDateSelectorChange();
  bindSearchEvent();
  filterEventsByCategoryAndDate();
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
window.onload = init;