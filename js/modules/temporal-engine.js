/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Temporal Engine Module
   Kalender-View mit intelligenten Layern
   ═══════════════════════════════════════════════════════════════════════════════ */

const TemporalEngine = {
  
  currentView: 'week', // day | week | month
  currentDate: new Date(),
  layers: {
    events: true,
    deadlines: true,
    milestones: true,
    habits: true,
    timeBlocks: true
  },
  
  // Initialize
  init() {
    this.render();
    this.setupEventListeners();
  },
  
  // Render the temporal engine
  render() {
    const container = document.getElementById('page-temporal-engine');
    if (!container) return;
    
    container.innerHTML = `
      <!-- Header with controls -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button class="btn btn-secondary btn-icon" id="te-prev">
            ${NexusUI.icon('chevron-left', 18)}
          </button>
          <h2 class="text-xl font-medium">${this.getDateTitle()}</h2>
          <button class="btn btn-secondary btn-icon" id="te-next">
            ${NexusUI.icon('chevron-right', 18)}
          </button>
          <button class="btn btn-ghost" id="te-today">Heute</button>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="tabs-pills">
            <button class="tab ${this.currentView === 'day' ? 'active' : ''}" data-view="day">Tag</button>
            <button class="tab ${this.currentView === 'week' ? 'active' : ''}" data-view="week">Woche</button>
            <button class="tab ${this.currentView === 'month' ? 'active' : ''}" data-view="month">Monat</button>
          </div>
          
          <button class="btn btn-primary">
            ${NexusUI.icon('plus', 16)}
            Neuer Event
          </button>
        </div>
      </div>
      
      <div class="layout-two-col">
        <div class="layout-two-col-main">
          
          <!-- Calendar View -->
          <div class="panel calendar-panel">
            <div class="panel-body p-0">
              ${this.currentView === 'week' ? this.renderWeekView() : 
                this.currentView === 'day' ? this.renderDayView() : 
                this.renderMonthView()}
            </div>
          </div>
          
        </div>
        
        <div class="layout-two-col-aside">
          
          <!-- Layer Controls -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">Layer</span>
            </div>
            <div class="panel-body">
              ${this.renderLayerControls()}
            </div>
          </div>
          
          <!-- Mini Calendar -->
          <div class="panel mb-6">
            <div class="panel-header">
              <span class="panel-title">${this.getMonthName(this.currentDate)}</span>
            </div>
            <div class="panel-body">
              ${this.renderMiniCalendar()}
            </div>
          </div>
          
          <!-- Upcoming -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Anstehend</span>
            </div>
            <div class="panel-body">
              ${this.renderUpcoming()}
            </div>
          </div>
          
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get date title based on view
  getDateTitle() {
    const options = { month: 'long', year: 'numeric' };
    if (this.currentView === 'day') {
      options.day = 'numeric';
      options.weekday = 'long';
    } else if (this.currentView === 'week') {
      const weekStart = this.getWeekStart(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.getDate()}. - ${weekEnd.getDate()}. ${this.getMonthName(this.currentDate)} ${this.currentDate.getFullYear()}`;
    }
    return this.currentDate.toLocaleDateString('de-DE', options);
  },
  
  // Get week start (Monday)
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  },
  
  // Get month name
  getMonthName(date) {
    return date.toLocaleDateString('de-DE', { month: 'long' });
  },
  
  // Render week view
  renderWeekView() {
    const weekStart = this.getWeekStart(this.currentDate);
    const days = [];
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    
    const hours = [];
    for (let h = 6; h < 22; h++) {
      hours.push(h);
    }
    
    const tasks = NexusStore.getTasks();
    const habits = NexusStore.getHabits();
    const today = new Date().toDateString();
    
    return `
      <div class="week-view">
        <!-- Header with day names -->
        <div class="week-header">
          <div class="time-gutter"></div>
          ${days.map((d, i) => `
            <div class="day-header ${d.toDateString() === today ? 'today' : ''}">
              <div class="day-name">${dayNames[i]}</div>
              <div class="day-number">${d.getDate()}</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Time grid -->
        <div class="week-grid">
          <div class="time-column">
            ${hours.map(h => `
              <div class="time-slot">${h.toString().padStart(2, '0')}:00</div>
            `).join('')}
          </div>
          
          ${days.map((d, dayIndex) => `
            <div class="day-column ${d.toDateString() === today ? 'today' : ''}">
              ${hours.map(h => `
                <div class="hour-cell" data-day="${dayIndex}" data-hour="${h}"></div>
              `).join('')}
              
              <!-- Events for this day -->
              ${this.renderDayEvents(d, dayIndex)}
            </div>
          `).join('')}
        </div>
        
        <!-- Now indicator -->
        ${this.renderNowIndicator()}
      </div>
    `;
  },
  
  // Render day view
  renderDayView() {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      hours.push(h);
    }
    
    return `
      <div class="day-view">
        <div class="time-column">
          ${hours.map(h => `
            <div class="time-slot">${h.toString().padStart(2, '0')}:00</div>
          `).join('')}
        </div>
        <div class="day-column today">
          ${hours.map(h => `
            <div class="hour-cell" data-hour="${h}"></div>
          `).join('')}
          ${this.renderDayEvents(this.currentDate, 0)}
        </div>
      </div>
    `;
  },
  
  // Render month view
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
    const daysInMonth = lastDay.getDate();
    const today = new Date().toDateString();
    
    const weeks = [];
    let currentWeek = [];
    
    // Previous month days
    for (let i = 1; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i));
      currentWeek.push({ date: d, isOtherMonth: true });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      currentWeek.push({ date: d, isOtherMonth: false, isToday: d.toDateString() === today });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Next month days
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const d = new Date(year, month + 1, nextDay++);
        currentWeek.push({ date: d, isOtherMonth: true });
      }
      weeks.push(currentWeek);
    }
    
    return `
      <div class="month-view">
        <div class="month-header">
          ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `
            <div class="month-day-name">${d}</div>
          `).join('')}
        </div>
        <div class="month-grid">
          ${weeks.map(week => `
            <div class="month-week">
              ${week.map(day => `
                <div class="month-day ${day.isOtherMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}" 
                     data-date="${day.date.toISOString().split('T')[0]}">
                  <div class="month-day-number">${day.date.getDate()}</div>
                  ${this.renderMonthDayEvents(day.date)}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // Render events for a specific day
  renderDayEvents(date, dayIndex) {
    const dateStr = date.toISOString().split('T')[0];
    const allTasks = NexusStore.getTasks().filter(t => {
      // Check both scheduledDate and deadline
      const taskDate = t.scheduledDate || t.deadline;
      if (!taskDate) return false;
      return taskDate.split('T')[0] === dateStr;
    });
    
    // Separate tasks with time from tasks without time
    const tasksWithTime = allTasks.filter(t => t.scheduledTime);
    const tasksWithoutTime = allTasks.filter(t => !t.scheduledTime);
    
    // Get time blocks from store (events with time)
    const events = NexusStore.state.events || [];
    const todayBlocks = events.filter(e => e.date === dateStr && e.startTime);
    
    let html = '';
    
    // Render events from store
    if (this.layers.events && todayBlocks.length > 0) {
      todayBlocks.forEach(block => {
        const startHour = parseInt(block.startTime?.split(':')[0] || 9);
        const endHour = parseInt(block.endTime?.split(':')[0] || startHour + 1);
        const top = (startHour - 6) * 60;
        const height = Math.max((endHour - startHour) * 60, 30);
        
        html += `
          <div class="calendar-event time-block type-${block.type || 'event'}" 
               style="top: ${top}px; height: ${height}px;">
            <div class="event-time">${block.startTime || ''} - ${block.endTime || ''}</div>
            <div class="event-title">${block.title}</div>
          </div>
        `;
      });
    }
    
    // Render tasks WITH scheduled time as time blocks
    tasksWithTime.forEach(task => {
      const [hours, minutes] = task.scheduledTime.split(':').map(Number);
      const top = (hours - 6) * 60 + (minutes || 0);
      const height = task.timeEstimate ? Math.max(task.timeEstimate, 30) : 45;
      
      const priorityClass = task.priority === 'critical' ? 'type-critical' : 
                            task.priority === 'high' ? 'type-high' : 'type-task';
      
      html += `
        <div class="calendar-event time-block ${priorityClass}" 
             style="top: ${top}px; height: ${height}px;" data-task-id="${task.id}">
          <div class="event-time">${task.scheduledTime}</div>
          <div class="event-title">${task.title}</div>
        </div>
      `;
    });
    
    // Render tasks WITHOUT time as deadline badges (at top)
    if (this.layers.deadlines && tasksWithoutTime.length > 0) {
      tasksWithoutTime.forEach((task, idx) => {
        html += `
          <div class="calendar-event deadline" 
               style="top: ${10 + idx * 28}px; right: 4px; left: auto; width: 100px; height: 24px;">
            <div class="event-title text-xs">${task.title}</div>
          </div>
        `;
      });
    }
    
    return html;
  },
  
  // Render month day events (dots only)
  renderMonthDayEvents(date) {
    const dateStr = date.toISOString().split('T')[0];
    const tasks = NexusStore.getTasks().filter(t => {
      const taskDate = t.scheduledDate || t.deadline;
      if (!taskDate) return false;
      return taskDate.split('T')[0] === dateStr;
    });
    
    if (tasks.length === 0) return '';
    
    return `
      <div class="month-day-events">
        ${tasks.slice(0, 3).map(t => `
          <div class="event-dot" style="background: var(--color-sphere-${t.sphere || 'geschaeft'})"></div>
        `).join('')}
        ${tasks.length > 3 ? `<span class="text-xs text-tertiary">+${tasks.length - 3}</span>` : ''}
      </div>
    `;
  },
  
  // Render now indicator
  renderNowIndicator() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < 6 || hour >= 22) return '';
    
    const top = (hour - 6) * 60 + minute;
    const weekStart = this.getWeekStart(this.currentDate);
    const dayOfWeek = (now.getDay() || 7) - 1; // Monday = 0
    
    // Check if today is in current week
    const today = new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (today < weekStart || today > weekEnd) return '';
    
    return `
      <div class="now-indicator" style="top: ${top + 48}px; left: calc(60px + ${dayOfWeek} * (100% - 60px) / 7);">
        <div class="now-dot"></div>
        <div class="now-line"></div>
      </div>
    `;
  },
  
  // Render layer controls
  renderLayerControls() {
    const layerConfig = [
      { id: 'events', icon: 'calendar', label: 'Events', color: 'var(--color-sphere-projekte)' },
      { id: 'deadlines', icon: 'clock', label: 'Deadlines', color: 'var(--color-critical)' },
      { id: 'milestones', icon: 'flag', label: 'Milestones', color: 'var(--color-sphere-geschaeft)' },
      { id: 'habits', icon: 'repeat', label: 'Habits', color: 'var(--color-sphere-sport)' },
      { id: 'timeBlocks', icon: 'layout', label: 'Time Blocks', color: 'var(--color-accent)' }
    ];
    
    return layerConfig.map(layer => `
      <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer layer-toggle" 
           data-layer="${layer.id}">
        <div class="toggle ${this.layers[layer.id] ? 'active' : ''}">
          <div class="toggle-slider"></div>
        </div>
        <div class="w-3 h-3 rounded-full" style="background: ${layer.color}"></div>
        <span class="text-sm">${layer.label}</span>
      </div>
    `).join('');
  },
  
  // Render mini calendar
  renderMiniCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() || 7;
    const daysInMonth = lastDay.getDate();
    const today = new Date().toDateString();
    
    let html = '<div class="mini-calendar">';
    html += '<div class="mini-cal-header">';
    ['M', 'D', 'M', 'D', 'F', 'S', 'S'].forEach(d => {
      html += `<div class="mini-cal-day">${d}</div>`;
    });
    html += '</div><div class="mini-cal-grid">';
    
    // Empty cells for days before month start
    for (let i = 1; i < startDay; i++) {
      html += '<div class="mini-cal-cell empty"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const isToday = d.toDateString() === today;
      const isSelected = d.toDateString() === this.currentDate.toDateString();
      html += `
        <div class="mini-cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
             data-date="${d.toISOString().split('T')[0]}">${day}</div>
      `;
    }
    
    html += '</div></div>';
    return html;
  },
  
  // Render upcoming events
  renderUpcoming() {
    const tasks = NexusStore.getTasks()
      .filter(t => t.status !== 'completed' && (t.scheduledDate || t.deadline))
      .sort((a, b) => {
        const dateA = a.scheduledDate || a.deadline;
        const dateB = b.scheduledDate || b.deadline;
        return new Date(dateA) - new Date(dateB);
      })
      .slice(0, 5);
    
    if (tasks.length === 0) {
      return '<div class="text-center text-tertiary p-4">Keine anstehenden Termine</div>';
    }
    
    return tasks.map(t => {
      const taskDate = t.scheduledDate || t.deadline;
      return `
      <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer mb-2">
        <div class="w-3 h-3 rounded-full" style="background: var(--color-sphere-${t.spheres?.[0] || 'geschaeft'})"></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm truncate">${t.title}</div>
          <div class="text-xs text-tertiary">${NexusUI.formatDate(new Date(taskDate))}</div>
        </div>
      </div>
    `;
    }).join('');
  },
  
  // Navigate calendar
  navigate(direction) {
    const d = new Date(this.currentDate);
    
    switch (this.currentView) {
      case 'day':
        d.setDate(d.getDate() + direction);
        break;
      case 'week':
        d.setDate(d.getDate() + (direction * 7));
        break;
      case 'month':
        d.setMonth(d.getMonth() + direction);
        break;
    }
    
    this.currentDate = d;
    this.render();
  },
  
  // Go to today
  goToToday() {
    this.currentDate = new Date();
    this.render();
  },
  
  // Switch view
  switchView(view) {
    this.currentView = view;
    this.render();
  },
  
  // Toggle layer
  toggleLayer(layerId) {
    this.layers[layerId] = !this.layers[layerId];
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Navigation
      if (e.target.closest('#te-prev')) {
        this.navigate(-1);
        return;
      }
      if (e.target.closest('#te-next')) {
        this.navigate(1);
        return;
      }
      if (e.target.closest('#te-today')) {
        this.goToToday();
        return;
      }
      
      // View switching
      const viewTab = e.target.closest('.tabs-pills .tab');
      if (viewTab && viewTab.dataset.view) {
        this.switchView(viewTab.dataset.view);
        return;
      }
      
      // Layer toggle
      const layerToggle = e.target.closest('.layer-toggle');
      if (layerToggle) {
        this.toggleLayer(layerToggle.dataset.layer);
        return;
      }
      
      // Mini calendar click
      const miniCell = e.target.closest('.mini-cal-cell:not(.empty)');
      if (miniCell && miniCell.dataset.date) {
        this.currentDate = new Date(miniCell.dataset.date);
        this.currentView = 'day';
        this.render();
        return;
      }
      
      // Month day click
      const monthDay = e.target.closest('.month-day:not(.other-month)');
      if (monthDay && monthDay.dataset.date) {
        this.currentDate = new Date(monthDay.dataset.date);
        this.currentView = 'day';
        this.render();
        return;
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'temporal-engine') {
    TemporalEngine.init();
  }
});

// Export
window.TemporalEngine = TemporalEngine;
