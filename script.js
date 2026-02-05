// 行程数据
const events = [
    { date: '2026-02-05', type: 'material', title: '官方高清写真发布', desc: '春日系列写真+拍摄花絮', link: 'https://weibo.com/xxx' },
    { date: '2026-02-10', type: 'stage', title: 'XX音乐节表演', desc: '新歌首秀+三首联唱', link: 'https://bilibili.com/video/xxx' },
    { date: '2026-02-15', type: 'show', title: 'XX综艺上线', desc: '飞行嘉宾+游戏环节', link: 'https://tv.cctv.com/xxx' },
    { date: '2026-02-20', type: 'live', title: '抖音直播', desc: '粉丝互动+新歌剧透', link: 'https://douyin.com/xxx' },
    { date: '2026-02-25', type: 'daily', title: '日常vlog更新', desc: '练习室日常+美食探店', link: 'https://bilibili.com/video/xxx' },
    { date: '2026-03-02', type: 'stage', title: '打歌舞台', desc: '主打歌打歌+直拍', link: 'https://weibo.com/xxx' }
];

// 当前显示的年月
let currentDate = new Date();
let currentFilter = 'all';

// 初始化日历
function initCalendar() {
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    setupEventListeners();
}

// 渲染日历
function renderCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    // 显示当前月份
    document.getElementById('current-month').textContent = `${year}年${month + 1}月`;

    // 添加上个月的空白日期
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(emptyDay);
    }

    // 添加当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.date === dateStr && (currentFilter === 'all' || event.type === currentFilter));
        
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        if (isToday(dateStr)) dayElement.classList.add('today');
        if (dayEvents.length > 0) dayElement.classList.add('has-event');

        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="event-dots"></div>
        `;

        // 添加事件点
        const eventDots = dayElement.querySelector('.event-dots');
        dayEvents.forEach(event => {
            const dot = document.createElement('div');
            dot.classList.add('event-dot', event.type);
            eventDots.appendChild(dot);
        });

        // 点击日期显示详情
        dayElement.addEventListener('click', () => {
            if (dayEvents.length > 0) {
                showEventModal(dateStr, dayEvents);
            }
        });

        calendarDays.appendChild(dayElement);
    }
}

// 判断是否是今天
function isToday(dateStr) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
}

// 显示事件详情弹窗
function showEventModal(date, events) {
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalEvents = document.getElementById('modal-events');

    modalTitle.textContent = `${date} 行程`;
    modalEvents.innerHTML = '';

    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.classList.add('modal-event', event.type);
        eventElement.innerHTML = `
            <h4>${event.title}</h4>
            <p>${event.desc}</p>
            ${event.link ? `<a href="${event.link}" target="_blank" style="color: #f7b84b; text-decoration: none; margin-top: 5px; display: inline-block;">查看详情 <i class="fas fa-arrow-right"></i></a>` : ''}
        `;
        modalEvents.appendChild(eventElement);
    });

    modal.style.display = 'block';
}

// 设置事件监听器
function setupEventListeners() {
    // 月份切换
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    // 关闭弹窗
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('event-modal').style.display = 'none';
    });

    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('event-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-type');
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    });
}

// 初始化
initCalendar();