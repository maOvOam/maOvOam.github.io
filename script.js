// 全局变量（修改预览相关）
let currentDate = new Date(2026, 1, 1);
let activeCategory = '全部动态';
let selectedYear = 2026;
let selectedMonth = '';
let selectedDay = '';
let eventsData = {}; // 当前月份行程数据
let loadedMonths = {}; // 记录已加载月份，避免重复请求


// ========== 提前定义 renderEventCard 函数（修复 ReferenceError） ==========
function renderEventCard(dateStr, event) {
  const [year, month, day] = dateStr.split('-');
  const tagBgColor = getTagBgColor(event.tag);
  const isMobile = window.innerWidth <= 768;

  // 兼容单图/多图（event.image 是数组则直接用，否则转数组）
  const imgList = Array.isArray(event.image) ? event.image : (event.image ? [event.image] : ["https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/20260201Figaro.jpg"]);

  // 渲染图片容器（修改：删除多余属性）
  const renderImgs = () => {
    let html = '';
    imgList.forEach((src, idx) => {
      // 最终可直接使用的代码
  const previewSrc = src 
    ? "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/" + src 
    : "https://cdn.jsdelivr.net/gh/maOvOam/maOvOam-img-bed/images/20260201Figaro.jpg";
      // 仅保留 class="event-img"
      html += `<img src="${previewSrc}" alt="${event.title}-${idx+1}" class="event-img" style="width:100%;height:100%;border-radius:8px;object-fit:cover;cursor:pointer;draggable:false;">`;
    });
    // 多图角标
    const countTip = imgList.length > 1 ? `<div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);color:white;font-size:12px;padding:2px 4px;border-radius:4px;">${imgList.length}图</div>` : '';
    return `<div style="position:relative;width:100%;height:100%;">${html}${countTip}</div>`;
  };

  // 手机端卡片
  if (isMobile) {
    return `
      <div class="event-card" style="background:${tagBgColor};width:100%;box-sizing:border-box;">
        <div class="event-card-left-mobile">
          <div class="event-time-badge-mobile">
            <span class="small-tag-mobile">${event.tag}</span>
            <div class="day-badge-mobile">${day}</div>
          </div>
          <div class="event-card-content-mobile">
            <div class="event-card-title-mobile"><a href="${event.link}" target="_blank">${event.title}</a></div>
            <div class="event-card-desc-mobile">${event.time}</div>
          </div>
        </div>
        <div class="event-card-right-mobile" style="position:relative;width:60px;height:60px;">${renderImgs()}</div>
      </div>
    `;
  } 
  // PC端卡片
  else {
    return `
      <div class="event-card" style="background:${tagBgColor};width:100%;box-sizing:border-box;">
        <div class="event-card-left">
          <div class="event-time-badge">${day}</div>
          <div class="event-card-content">
            <div class="event-card-title"><span class="small-tag">${event.tag}</span><a href="${event.link}" target="_blank">${event.title}</a></div>
            <div class="event-card-desc">${event.time}</div>
          </div>
        </div>
        <div class="event-card-right" style="position:relative;width:80px;height:80px;">${renderImgs()}</div>
      </div>
    `;
  }
}


// 新增：加载指定年月的JSON行程文件（核心新增函数）
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
    eventsData = await res.json();
    loadedMonths[`${year}_${monthStr}`] = true;
  } catch (err) {
    eventsData = {};
    alert(`加载${year}年${monthStr}月行程失败，请检查JSON文件是否存在/格式是否正确`);
  }
}

// 初始化页面（新增：弹窗事件绑定）
window.onload = async function() {
  // 原有选择器初始化代码
  selectedYear = Number(document.getElementById('yearSelect').value);
  selectedMonth = document.getElementById('monthSelect').value;
  selectedMonth = selectedMonth === '' ? '' : Number(selectedMonth);
  selectedDay = '';
  document.getElementById('yearSelect-pc').value = selectedYear;
  document.getElementById('monthSelect-pc').value = selectedMonth;
  document.getElementById('daySelect-pc').value = selectedDay;

  // 加载默认月份（2026年2月）
  if (selectedMonth === '') {
    await loadMonthEvents(selectedYear, 2);
  } else {
    await loadMonthEvents(selectedYear, selectedMonth);
  }

  // 原有初始化逻辑
  renderCalendar(selectedYear, selectedMonth);
  initDaySelect();
  bindCategoryTabEvent();
  bindAllDateSelectorChange();
  filterEventsByCategoryAndDate();
};

// 渲染日历
function renderCalendar(year, month) {
  const calendarGrid = document.querySelector('.calendar-grid');
  const monthTitle = document.querySelector('.month-title');
  if (!calendarGrid || !monthTitle) return;

  const weekdays = Array.from(calendarGrid.querySelectorAll('.weekday'));
  calendarGrid.innerHTML = '';
  weekdays.forEach(day => calendarGrid.appendChild(day));
  calendarGrid.style.display = 'grid';

  if (!month || month === '') {
    monthTitle.textContent = `${year}年`;
    return;
  }

  monthTitle.textContent = `${year}年${month}月`;
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
        const eventTag = document.createElement('div');
        eventTag.className = `event-tag ${event.tag}`;
        eventTag.textContent = event.tag;
        eventTag.style.backgroundColor = getTagBgColor(event.tag);
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

// 初始化日期选择器
function initDaySelect() {
  const yearSel = document.getElementById('yearSelect');
  const yearSelPc = document.getElementById('yearSelect-pc');
  const monthSel = document.getElementById('monthSelect');
  const monthSelPc = document.getElementById('monthSelect-pc');
  const daySel = document.getElementById('daySelect');
  const daySelPc = document.getElementById('daySelect-pc');
  
  const currentYear = selectedYear;
  yearSel.value = currentYear;
  yearSelPc.value = currentYear;
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

// 导航栏切换月份
function changeMonth(delta) {
  if (!selectedMonth || selectedMonth === '') {
    selectedYear += delta;
  } else {
    const newDate = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    selectedYear = newDate.getFullYear();
    selectedMonth = newDate.getMonth() + 1;
  }

  document.getElementById('yearSelect').value = selectedYear;
  document.getElementById('monthSelect').value = selectedMonth;
  document.getElementById('yearSelect-pc').value = selectedYear;
  document.getElementById('monthSelect-pc').value = selectedMonth;
  selectedDay = '';
  document.getElementById('daySelect').value = '';
  document.getElementById('daySelect-pc').value = '';

  // 加载对应月份JSON
  if (selectedMonth !== '') loadMonthEvents(selectedYear, selectedMonth);
  
  initDaySelect();
  renderCalendar(selectedYear, selectedMonth);
  filterEventsByCategoryAndDate();
}

// 绑定所有选择器事件
function bindAllDateSelectorChange() {
  // 手机端年份选择器
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

  // 手机端月份选择器
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

  // 手机端日期选择器
  document.getElementById('daySelect').addEventListener('change', function() {
    selectedDay = this.value === '' ? '' : String(this.value).padStart(2, '0');
    document.getElementById('daySelect-pc').value = this.value;
    filterEventsByCategoryAndDate();
  });

  // PC端年份选择器
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

  // PC端月份选择器
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

  // PC端日期选择器
  document.getElementById('daySelect-pc').addEventListener('change', function() {
    selectedDay = this.value === '' ? '' : String(this.value).padStart(2, '0');
    document.getElementById('daySelect').value = this.value;
    filterEventsByCategoryAndDate();
  });
}

// 绑定分类标签事件
function bindCategoryTabEvent() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.dataset.target;
      filterEventsByCategoryAndDate();
    });
  });
}

// 筛选行程
function filterEventsByCategoryAndDate() {
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  let filterResult = [];

  // 遍历行程数据筛选
  for (const [dateStr, eventList] of Object.entries(eventsData)) {
    const [y, m, d] = dateStr.split('-');
    const yNum = Number(y);
    const mNum = Number(m);
    const dStr = d;

    for (const event of eventList) {
      const categoryMatch = activeCategory === '全部动态' || event.tag === activeCategory;
      let timeMatch = false;

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

  // 排序并渲染
  filterResult.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  if (!selectedMonth && !selectedDay) {
    if (filterResult.length === 0) {
      eventsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无相关行程</div>';
    } else {
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
    }
  } else {
    if (filterResult.length === 0) {
      eventsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无相关行程</div>';
    } else {
      filterResult.forEach(item => {
        eventsList.innerHTML += renderEventCard(item.dateStr, item.event);
      });
    }
  }

  document.querySelector('.events-panel').classList.add('active');
  updateEventsPanelTitle();
}

// 打开行程详情
function openDetail(dateStr) {
  const eventList = eventsData[dateStr] || [];
  const date = new Date(dateStr);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];

  document.getElementById('eventsDateTitle').textContent = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${weekday} · ${activeCategory}`;
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

// 关闭行程面板
function closeEventsPanel() {
  document.querySelector('.events-panel').classList.remove('active');
}

// 更新面板标题
function updateEventsPanelTitle() {
  const titleEl = document.getElementById('eventsDateTitle');
  let title = '';

  if (!selectedMonth && !selectedDay) {
    title = `${selectedYear}年 · ${activeCategory}`;
  } else if (!selectedMonth && selectedDay) {
    title = `${selectedYear}年 每月${selectedDay}日 · ${activeCategory}`;
  } else if (selectedMonth && !selectedDay) {
    title = `${selectedYear}年${selectedMonth}月 · ${activeCategory}`;
  } else {
    title = `${selectedYear}年${selectedMonth}月${selectedDay}日 · ${activeCategory}`;
  }

  titleEl.textContent = title;
}

// 获取标签背景色
function getTagBgColor(tag) {
  const colorMap = {
    打歌: '#ff7d00',
    舞台: '#ff6b8b',
    综艺: '#7e57c2',
    物料: '#66bb6a',
    直播: '#ef5350',
    回归日程: '#42a5f5',
    猫言猫语: '#ab47bc'
  };
  return colorMap[tag] || '#6b77e5';
}
// 极简稳定版多图预览
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('event-img')) {
    // 获取当前卡片里的所有图片
    const card = e.target.closest('.event-card');
    const imgs = Array.from(card.querySelectorAll('.event-img'));
    let currentIndex = imgs.indexOf(e.target);

    // 1. 直接创建完整弹窗（避免查询失败）
    const modal = document.createElement('div');
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; align-items: center;
      justify-content: center; z-index: 9999;
    `;

    // 2. 创建预览图
    const previewImg = document.createElement('img');
    previewImg.src = imgs[currentIndex].src;
    previewImg.style = 'max-width: 80%; max-height: 80%;';

    // 3. 创建按钮并直接绑定事件
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.style = `
      position: absolute; left: 30px; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.2); color: white; border: none;
      font-size: 30px; padding: 10px; cursor: pointer;
    `;
    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
      previewImg.src = imgs[currentIndex].src;
    };

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.style = `
      position: absolute; right: 30px; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.2); color: white; border: none;
      font-size: 30px; padding: 10px; cursor: pointer;
    `;
    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % imgs.length;
      previewImg.src = imgs[currentIndex].src;
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style = `
      position: absolute; top: 20px; right: 20px;
      background: rgba(255,255,255,0.2); color: white; border: none;
      font-size: 24px; padding: 5px 15px; cursor: pointer;
    `;
    closeBtn.onclick = () => {
      document.body.removeChild(modal);
    };

    // 4. 组装并显示弹窗
    modal.appendChild(prevBtn);
    modal.appendChild(previewImg);
    modal.appendChild(nextBtn);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    // 5. 点击弹窗外层关闭
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // 6. ESC键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    });
  }
});