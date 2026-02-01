/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Habits Module
   Full habit tracking view with advanced frequency cycles
   ═══════════════════════════════════════════════════════════════════════════════ */

const HabitsModule = {
  
  view: 'today', // today | week | month | all
  selectedHabits: [], // For month view multi-select
  monthOffset: 0, // 0 = current month, -1 = last month
  _listenersInitialized: false,
  
  // Available frequency types
  FREQUENCY_TYPES: {
    daily: { label: '📅 Täglich', description: 'Jeden Tag' },
    weekdays: { label: '💼 Werktags', description: 'Montag bis Freitag' },
    weekends: { label: '🌴 Wochenende', description: 'Samstag und Sonntag' },
    weekly: { label: '📆 Bestimmte Tage', description: 'An ausgewählten Wochentagen' },
    everyXDays: { label: '🔄 Alle X Tage', description: 'z.B. alle 2, 3 Tage' },
    xTimesPerWeek: { label: '🎯 X mal pro Woche', description: 'Flexible Tage wählen' },
    xTimesPerMonth: { label: '📊 X mal pro Monat', description: 'Monatliches Ziel' },
    monthlyDays: { label: '📅 Bestimmte Monatstage', description: 'z.B. 1., 15. des Monats' }
  },
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render the habits page
  render() {
    const container = document.getElementById('page-habits');
    if (!container) return;
    
    const habits = NexusStore.getHabits();
    const stats = this.getStats(habits);
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Habits</h2>
          <p class="text-secondary">${stats.completedToday}/${stats.totalDueToday} heute erledigt</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="btn btn-primary" id="add-habit-btn">
            ${NexusUI.icon('plus', 16)}
            Neuer Habit
          </button>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Heute</div>
          <div class="stat-value">${stats.completedToday}/${stats.totalDueToday}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Diese Woche</div>
          <div class="stat-value">${stats.weekPercentage}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Längster Streak</div>
          <div class="stat-value">${stats.longestStreak}🔥</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Aktiver Streak</div>
          <div class="stat-value">${stats.currentStreak}🔥</div>
        </div>
      </div>
      
      <!-- View Tabs -->
      <div class="tabs mb-6">
        <button class="tab ${this.view === 'today' ? 'active' : ''}" data-view="today">Heute</button>
        <button class="tab ${this.view === 'week' ? 'active' : ''}" data-view="week">Woche</button>
        <button class="tab ${this.view === 'month' ? 'active' : ''}" data-view="month">Monat</button>
        <button class="tab ${this.view === 'all' ? 'active' : ''}" data-view="all">Alle Habits</button>
      </div>
      
      <!-- Content -->
      ${this.view === 'today' ? this.renderTodayView(habits) :
        this.view === 'week' ? this.renderWeekView(habits) :
        this.view === 'month' ? this.renderMonthView(habits) :
        this.renderAllView(habits)}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get stats
  getStats(habits) {
    const today = new Date().toISOString().split('T')[0];
    
    // Only count habits that are due today
    const habitsDueToday = habits.filter(h => this.isHabitDueOnDate(h, today));
    const completedToday = habitsDueToday.filter(h => h.completionLog?.includes(today)).length;
    const totalDueToday = habitsDueToday.length;
    
    // Week stats - only count days where habit was due
    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekDays.push(d.toISOString().split('T')[0]);
    }
    
    let weekCompleted = 0;
    let weekTotal = 0;
    habits.forEach(h => {
      weekDays.forEach(day => {
        if (this.isHabitDueOnDate(h, day)) {
          weekTotal++;
          if (h.completionLog?.includes(day)) weekCompleted++;
        }
      });
    });
    const weekPercentage = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
    
    // Streaks
    let longestStreak = 0;
    let currentStreak = 0;
    habits.forEach(h => {
      if (h.streak > longestStreak) longestStreak = h.streak;
      if (h.streak > currentStreak) currentStreak = h.streak;
    });
    
    return { completedToday, totalDueToday, weekPercentage, longestStreak, currentStreak };
  },
  
  // Render today view
  renderTodayView(habits) {
    const today = new Date().toISOString().split('T')[0];
    
    if (habits.length === 0) {
      return `
        <div class="panel">
          <div class="panel-body">
            <div class="empty-state p-8">
              <div class="text-4xl mb-4">🔄</div>
              <h3 class="text-lg mb-2">Keine Habits</h3>
              <p class="text-secondary mb-4">Erstelle deinen ersten Habit!</p>
              <button class="btn btn-primary" id="add-habit-btn-empty">
                ${NexusUI.icon('plus', 16)}
                Habit erstellen
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    // Only show habits in "pending" that are actually due today and not completed
    const pending = habits.filter(h => this.isHabitDueOnDate(h, today) && !h.completionLog?.includes(today));
    // Show completed habits for today (regardless if they were due)
    const completed = habits.filter(h => h.completionLog?.includes(today));
    
    return `
      <!-- Pending Habits -->
      ${pending.length > 0 ? `
        <div class="panel mb-6">
          <div class="panel-header">
            <span class="panel-title">○ Ausstehend (${pending.length})</span>
          </div>
          <div class="panel-body">
            <div class="content-stack gap-3">
              ${pending.map(h => this.renderHabitCard(h, false)).join('')}
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Completed Habits -->
      ${completed.length > 0 ? `
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title text-success">✓ Erledigt (${completed.length})</span>
          </div>
          <div class="panel-body">
            <div class="content-stack gap-3">
              ${completed.map(h => this.renderHabitCard(h, true)).join('')}
            </div>
          </div>
        </div>
      ` : ''}
      
      ${pending.length === 0 && completed.length > 0 ? `
        <div class="atlas-panel mt-6">
          <div class="atlas-header">
            <div class="atlas-icon">🎉</div>
            <span class="atlas-title">Alle Habits erledigt!</span>
          </div>
          <div class="atlas-body">
            Großartig! Du hast heute alle ${completed.length} Habits abgeschlossen. Weiter so!
          </div>
        </div>
      ` : ''}
    `;
  },
  
  // Render habit card
  renderHabitCard(habit, isCompleted) {
    const today = new Date().toISOString().split('T')[0];
    const isDueToday = this.isHabitDueOnDate(habit, today);
    const flexProgress = this.getFlexibleProgress(habit);
    
    // For everyXDays, show when next due
    let nextDueInfo = '';
    if (habit.frequency === 'everyXDays' && !isDueToday) {
      const nextDue = this.getNextDueDate(habit);
      if (nextDue) {
        const daysUntil = Math.ceil((nextDue - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil === 1) {
          nextDueInfo = '⏰ Morgen fällig';
        } else if (daysUntil > 1) {
          nextDueInfo = `⏰ In ${daysUntil} Tagen`;
        }
      }
    }
    
    return `
      <div class="habit-card ${isCompleted ? 'completed' : ''} ${!isDueToday && !flexProgress ? 'not-due' : ''}" data-habit-id="${habit.id}">
        <div class="flex items-center gap-4">
          <button class="habit-check ${isCompleted ? 'checked' : ''}" data-action="toggle" ${!isDueToday && habit.frequency === 'everyXDays' ? 'disabled title="Heute nicht fällig"' : ''}>
            ${isCompleted ? '✓' : ''}
          </button>
          
          <div class="habit-icon text-2xl">${habit.icon || '🔄'}</div>
          
          <div class="flex-1 min-w-0">
            <div class="habit-name font-medium ${isCompleted ? 'text-tertiary' : ''}">${habit.name}</div>
            <div class="flex items-center gap-3 text-xs text-tertiary mt-1">
              <span>${this.getFrequencyLabel(habit)}</span>
              ${habit.streak > 0 ? `<span class="text-warning">🔥 ${habit.streak} Tage</span>` : ''}
              ${nextDueInfo ? `<span class="text-info">${nextDueInfo}</span>` : ''}
            </div>
            ${flexProgress ? `
              <div class="flex items-center gap-2 mt-1">
                <div class="progress-bar-mini" style="width: 80px;">
                  <div class="progress-fill ${flexProgress.isOnTrack ? 'on-track' : 'behind'}" 
                       style="width: ${Math.min(100, (flexProgress.completed / flexProgress.target) * 100)}%"></div>
                </div>
                <span class="text-xs ${flexProgress.isOnTrack ? 'text-success' : 'text-warning'}">
                  ${flexProgress.completed}/${flexProgress.target} diese ${flexProgress.period}
                </span>
              </div>
            ` : ''}
          </div>
          
          ${habit.sphere ? `
            <span class="badge" style="background: var(--color-sphere-${habit.sphere}); color: white;">
              ${habit.sphere}
            </span>
          ` : ''}
          
          <div class="habit-actions flex items-center gap-1">
            <button class="btn-icon-sm" data-action="edit" title="Bearbeiten">
              ${NexusUI.icon('edit-2', 14)}
            </button>
            <button class="btn-icon-sm" data-action="delete" title="Löschen">
              ${NexusUI.icon('trash-2', 14)}
            </button>
          </div>
        </div>
        
        <!-- Mini week view -->
        <div class="habit-week mt-3 flex gap-1">
          ${this.renderMiniWeek(habit)}
        </div>
      </div>
    `;
  },
  
  // Render mini week
  renderMiniWeek(habit) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = habit.completionLog?.includes(dateStr);
      const isDue = this.isHabitDueOnDate(habit, dateStr);
      const dayName = d.toLocaleDateString('de-DE', { weekday: 'narrow' });
      
      let dotClass = '';
      if (isCompleted) {
        dotClass = 'filled';
      } else if (!isDue) {
        dotClass = 'not-due';
      }
      
      days.push(`
        <div class="habit-day ${isCompleted ? 'completed' : ''} ${!isDue ? 'not-due' : ''}" 
             title="${d.toLocaleDateString('de-DE')}${!isDue ? ' (nicht fällig)' : ''}">
          <div class="habit-day-name">${dayName}</div>
          <div class="habit-day-dot ${dotClass}"></div>
        </div>
      `);
    }
    return days.join('');
  },
  
  // Render week view
  renderWeekView(habits) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('de-DE', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    
    return `
      <div class="panel">
        <div class="panel-body p-0">
          <div class="habit-week-grid">
            <!-- Header -->
            <div class="habit-week-header">
              <div class="habit-week-name-col">Habit</div>
              ${days.map(d => `
                <div class="habit-week-day-col ${d.dateStr === new Date().toISOString().split('T')[0] ? 'today' : ''}">
                  <div class="day-name">${d.dayName}</div>
                  <div class="day-num">${d.dayNum}</div>
                </div>
              `).join('')}
            </div>
            
            <!-- Rows -->
            ${habits.map(habit => `
              <div class="habit-week-row" data-habit-id="${habit.id}">
                <div class="habit-week-name">
                  <span class="habit-icon">${habit.icon || '🔄'}</span>
                  <span>${habit.name}</span>
                </div>
                ${days.map(d => {
                  const isCompleted = habit.completionLog?.includes(d.dateStr);
                  return `
                    <div class="habit-week-cell ${isCompleted ? 'completed' : ''}" 
                         data-date="${d.dateStr}"
                         data-action="toggle-date">
                      ${isCompleted ? '✓' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  // Render month view - track multiple habits on calendar
  renderMonthView(habits) {
    const now = new Date();
    now.setMonth(now.getMonth() + this.monthOffset);
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    // Build weeks array
    const weeks = [];
    let currentWeek = new Array(startDayOfWeek).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    
    // Selected habits for display
    const displayHabits = this.selectedHabits.length > 0 
      ? habits.filter(h => this.selectedHabits.includes(h.id))
      : habits;
    
    return `
      <div class="panel mb-4">
        <div class="panel-header">
          <div class="flex items-center gap-3">
            <button class="btn btn-sm btn-ghost" data-action="prev-month">
              ${NexusUI.icon('chevron-left', 16)}
            </button>
            <span class="panel-title">${monthName}</span>
            <button class="btn btn-sm btn-ghost" data-action="next-month">
              ${NexusUI.icon('chevron-right', 16)}
            </button>
          </div>
          <div class="text-sm text-tertiary">
            ${displayHabits.length} Habit${displayHabits.length !== 1 ? 's' : ''} ausgewählt
          </div>
        </div>
      </div>
      
      <!-- Habit selector -->
      <div class="panel mb-4">
        <div class="panel-body">
          <div class="flex flex-wrap gap-2">
            ${habits.map(h => `
              <button class="btn btn-sm ${this.selectedHabits.includes(h.id) ? 'btn-primary' : 'btn-ghost'}"
                      data-action="toggle-habit-select" data-habit-id="${h.id}">
                ${h.icon || '🔄'} ${h.name}
              </button>
            `).join('')}
            ${habits.length > 0 ? `
              <button class="btn btn-sm btn-ghost" data-action="select-all-habits">
                Alle ${this.selectedHabits.length === habits.length ? 'abwählen' : 'auswählen'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Month calendar grid -->
      <div class="panel">
        <div class="panel-body p-0">
          <div class="habit-month-grid">
            <div class="habit-month-header">
              ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `
                <div class="habit-month-day-name">${d}</div>
              `).join('')}
            </div>
            ${weeks.map(week => `
              <div class="habit-month-week">
                ${week.map(day => {
                  if (!day) return '<div class="habit-month-cell empty"></div>';
                  
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  
                  // Only count habits that are due on this day
                  const dueHabits = displayHabits.filter(h => this.isHabitDueOnDate(h, dateStr));
                  
                  // Count completions for habits due on this day
                  const completions = dueHabits.map(h => ({
                    habit: h,
                    completed: h.completionLog?.includes(dateStr),
                    isDue: true
                  }));
                  const completedCount = completions.filter(c => c.completed).length;
                  const allCompleted = dueHabits.length > 0 && completedCount === dueHabits.length;
                  const noDueHabits = dueHabits.length === 0;
                  
                  return `
                    <div class="habit-month-cell ${isToday ? 'today' : ''} ${allCompleted ? 'all-completed' : ''} ${noDueHabits ? 'no-habits-due' : ''}"
                         data-date="${dateStr}">
                      <div class="cell-day">${day}</div>
                      <div class="cell-dots">
                        ${completions.slice(0, 5).map(c => `
                          <div class="habit-dot ${c.completed ? 'completed' : ''}" 
                               title="${c.habit.name}"
                               style="${c.completed ? `background: var(--color-sphere-${c.habit.sphere || 'sport'})` : ''}">
                          </div>
                        `).join('')}
                        ${completions.length > 5 ? `<span class="text-xs">+${completions.length - 5}</span>` : ''}
                      </div>
                      ${dueHabits.length > 0 ? `
                        <div class="cell-count ${allCompleted ? 'complete' : ''}">${completedCount}/${dueHabits.length}</div>
                      ` : displayHabits.length > 0 ? `
                        <div class="cell-count no-due">–</div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  // Render all habits view
  renderAllView(habits) {
    return `
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Alle Habits (${habits.length})</span>
        </div>
        <div class="panel-body">
          ${habits.length === 0 ? `
            <div class="text-center text-tertiary p-4">
              Keine Habits definiert
            </div>
          ` : `
            <div class="content-stack gap-4">
              ${habits.map(habit => `
                <div class="habit-detail-card" data-habit-id="${habit.id}">
                  <div class="flex items-start gap-4">
                    <div class="text-3xl">${habit.icon || '🔄'}</div>
                    <div class="flex-1">
                      <div class="font-medium text-lg">${habit.name}</div>
                      <div class="text-secondary text-sm mb-2">${habit.description || 'Keine Beschreibung'}</div>
                      <div class="flex items-center gap-4 text-sm">
                        <span>${this.getFrequencyLabel(habit)}</span>
                        ${habit.sphere ? `<span class="badge" style="background: var(--color-sphere-${habit.sphere})">${habit.sphere}</span>` : ''}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-warning">${habit.streak || 0}🔥</div>
                      <div class="text-xs text-tertiary">Streak</div>
                    </div>
                    <div class="flex gap-1">
                      <button class="btn-icon-sm" data-action="edit">
                        ${NexusUI.icon('edit-2', 14)}
                      </button>
                      <button class="btn-icon-sm" data-action="delete">
                        ${NexusUI.icon('trash-2', 14)}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Stats -->
                  <div class="grid gap-4 mt-4" style="grid-template-columns: repeat(4, 1fr);">
                    <div>
                      <div class="text-tertiary text-xs">Gesamt</div>
                      <div class="font-medium">${habit.completionLog?.length || 0} Tage</div>
                    </div>
                    <div>
                      <div class="text-tertiary text-xs">Beste Streak</div>
                      <div class="font-medium">${habit.bestStreak || habit.streak || 0} Tage</div>
                    </div>
                    <div>
                      <div class="text-tertiary text-xs">Erfolgsquote</div>
                      <div class="font-medium">${this.getSuccessRate(habit)}%</div>
                    </div>
                    <div>
                      <div class="text-tertiary text-xs">Erstellt</div>
                      <div class="font-medium">${NexusUI.formatDate(new Date(habit.createdAt))}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },
  
  // Get frequency label
  getFrequencyLabel(habit) {
    const frequency = habit.frequency || 'daily';
    const scheduledDays = habit.scheduledDays;
    
    switch (frequency) {
      case 'daily':
        return '📅 Täglich';
        
      case 'weekdays':
        return '💼 Werktags (Mo-Fr)';
        
      case 'weekends':
        return '🌴 Wochenende (Sa-So)';
        
      case 'weekly':
        if (scheduledDays && scheduledDays.length > 0) {
          const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
          const days = scheduledDays.map(d => dayNames[d]).join(', ');
          return `📆 ${days}`;
        }
        return '📆 Wöchentlich';
        
      case 'everyXDays':
        const interval = habit.intervalDays || 2;
        return `🔄 Alle ${interval} Tage`;
        
      case 'xTimesPerWeek':
        const timesWeek = habit.timesPerPeriod || 3;
        return `🎯 ${timesWeek}x pro Woche`;
        
      case 'xTimesPerMonth':
        const timesMonth = habit.timesPerPeriod || 10;
        return `📊 ${timesMonth}x pro Monat`;
        
      case 'monthlyDays':
        if (habit.monthDays && habit.monthDays.length > 0) {
          const days = habit.monthDays.slice(0, 3).join('., ') + '.';
          const more = habit.monthDays.length > 3 ? ` +${habit.monthDays.length - 3}` : '';
          return `📅 ${days}${more}`;
        }
        return '📅 Monatstage';
        
      default:
        return '📅 Täglich';
    }
  },
  
  // Check if a habit is due on a specific date
  isHabitDueOnDate(habit, dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const dayOfMonth = date.getDate();
    const frequency = habit.frequency || 'daily';
    
    switch (frequency) {
      case 'daily':
        return true;
        
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
        
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
        
      case 'weekly':
        if (habit.scheduledDays && habit.scheduledDays.length > 0) {
          return habit.scheduledDays.includes(dayOfWeek);
        }
        return true; // Fallback: every day if no days selected
        
      case 'everyXDays':
        if (!habit.startDate) return true;
        const startDate = new Date(habit.startDate);
        startDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(dateStr);
        currentDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const interval = habit.intervalDays || 2;
        return diffDays >= 0 && diffDays % interval === 0;
        
      case 'xTimesPerWeek':
        // For xTimesPerWeek, every day is "eligible" but we track against goal
        return true;
        
      case 'xTimesPerMonth':
        // For xTimesPerMonth, every day is "eligible" but we track against goal
        return true;
        
      case 'monthlyDays':
        if (habit.monthDays && habit.monthDays.length > 0) {
          return habit.monthDays.includes(dayOfMonth);
        }
        return true;
        
      default:
        return true;
    }
  },
  
  // Check if habit meets its flexible goal (for xTimesPerWeek/Month)
  getFlexibleProgress(habit) {
    const frequency = habit.frequency;
    if (frequency !== 'xTimesPerWeek' && frequency !== 'xTimesPerMonth') {
      return null;
    }
    
    const completionLog = habit.completionLog || [];
    const target = habit.timesPerPeriod || 3;
    const now = new Date();
    
    if (frequency === 'xTimesPerWeek') {
      // Get start of current week (Monday)
      const weekStart = new Date(now);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const completedThisWeek = completionLog.filter(d => {
        const date = new Date(d);
        return date >= weekStart && date <= weekEnd;
      }).length;
      
      const daysLeftInWeek = 7 - now.getDay();
      const remaining = Math.max(0, target - completedThisWeek);
      
      return {
        completed: completedThisWeek,
        target,
        remaining,
        period: 'Woche',
        daysLeft: daysLeftInWeek,
        isOnTrack: completedThisWeek >= target || remaining <= daysLeftInWeek
      };
    }
    
    if (frequency === 'xTimesPerMonth') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const completedThisMonth = completionLog.filter(d => {
        const date = new Date(d);
        return date >= monthStart && date <= monthEnd;
      }).length;
      
      const daysLeftInMonth = monthEnd.getDate() - now.getDate() + 1;
      const remaining = Math.max(0, target - completedThisMonth);
      
      return {
        completed: completedThisMonth,
        target,
        remaining,
        period: 'Monat',
        daysLeft: daysLeftInMonth,
        isOnTrack: completedThisMonth >= target || remaining <= daysLeftInMonth
      };
    }
    
    return null;
  },
  
  // Get next due date for everyXDays habits
  getNextDueDate(habit) {
    if (habit.frequency !== 'everyXDays' || !habit.startDate) return null;
    
    const interval = habit.intervalDays || 2;
    const startDate = new Date(habit.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const daysSinceLastDue = diffDays % interval;
    const daysUntilNextDue = daysSinceLastDue === 0 ? 0 : interval - daysSinceLastDue;
    
    const nextDue = new Date(today);
    nextDue.setDate(nextDue.getDate() + daysUntilNextDue);
    
    return nextDue;
  },
  
  // Get success rate (accounting for scheduled days and frequency type)
  getSuccessRate(habit) {
    if (!habit.createdAt) return 0;
    
    const frequency = habit.frequency || 'daily';
    const completionLog = habit.completionLog || [];
    const completed = completionLog.length;
    
    // For flexible habits, calculate differently
    if (frequency === 'xTimesPerWeek' || frequency === 'xTimesPerMonth') {
      return this.getFlexibleSuccessRate(habit);
    }
    
    const start = new Date(habit.createdAt);
    const now = new Date();
    
    // Count only days where the habit was due
    let dueDays = 0;
    let currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (this.isHabitDueOnDate(habit, dateStr)) {
        dueDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (dueDays === 0) return 100;
    
    return Math.round((completed / dueDays) * 100);
  },
  
  // Get success rate for flexible habits (xTimesPerWeek/Month)
  getFlexibleSuccessRate(habit) {
    const frequency = habit.frequency;
    const completionLog = habit.completionLog || [];
    const target = habit.timesPerPeriod || 3;
    const createdAt = new Date(habit.createdAt);
    const now = new Date();
    
    let totalPeriods = 0;
    let successfulPeriods = 0;
    
    if (frequency === 'xTimesPerWeek') {
      // Count completed weeks
      let currentWeekStart = new Date(createdAt);
      const day = currentWeekStart.getDay();
      const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
      currentWeekStart.setDate(diff);
      currentWeekStart.setHours(0, 0, 0, 0);
      
      while (currentWeekStart <= now) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Skip future incomplete weeks
        if (weekEnd > now && currentWeekStart.getTime() === this.getWeekStart(now).getTime()) {
          break; // Don't count current incomplete week
        }
        
        const completedInWeek = completionLog.filter(d => {
          const date = new Date(d);
          return date >= currentWeekStart && date <= weekEnd;
        }).length;
        
        totalPeriods++;
        if (completedInWeek >= target) successfulPeriods++;
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
    } else if (frequency === 'xTimesPerMonth') {
      // Count completed months
      let currentMonth = new Date(createdAt.getFullYear(), createdAt.getMonth(), 1);
      
      while (currentMonth <= now) {
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Skip current incomplete month
        if (currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear()) {
          break;
        }
        
        const completedInMonth = completionLog.filter(d => {
          const date = new Date(d);
          return date >= currentMonth && date <= monthEnd;
        }).length;
        
        totalPeriods++;
        if (completedInMonth >= target) successfulPeriods++;
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }
    
    if (totalPeriods === 0) return 100;
    return Math.round((successfulPeriods / totalPeriods) * 100);
  },
  
  // Helper: Get start of week (Monday)
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },
  
  // Calculate streak considering frequency type
  calculateStreak(habit) {
    const frequency = habit.frequency || 'daily';
    const completionLog = habit.completionLog || [];
    
    if (completionLog.length === 0) return 0;
    
    // For flexible habits, calculate period-based streak
    if (frequency === 'xTimesPerWeek') {
      return this.calculateWeeklyStreak(habit);
    }
    if (frequency === 'xTimesPerMonth') {
      return this.calculateMonthlyStreak(habit);
    }
    
    // For fixed schedule habits, calculate day-based streak
    const sortedDates = [...completionLog].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check if today or yesterday should be starting point
    const todayStr = today.toISOString().split('T')[0];
    const isDueToday = this.isHabitDueOnDate(habit, todayStr);
    const completedToday = completionLog.includes(todayStr);
    
    // If NOT due today (e.g., Sunday for a Tue/Thu/Sat habit), 
    // start counting from the last day it was due
    if (!isDueToday) {
      // Find the last day it was due
      let found = false;
      for (let i = 1; i <= 7; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (this.isHabitDueOnDate(habit, checkDate.toISOString().split('T')[0])) {
          found = true;
          break;
        }
      }
      if (!found) {
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else if (isDueToday && !completedToday) {
      // Due today but not completed - still allow streak from yesterday
      // This gives leniency during the day
      checkDate.setDate(checkDate.getDate() - 1);
    }
    // If completed today and due today, start from today (checkDate stays at today)
    
    // Count streak backwards
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const wasDue = this.isHabitDueOnDate(habit, dateStr);
      const wasCompleted = completionLog.includes(dateStr);
      
      if (wasDue) {
        if (wasCompleted) {
          streak++;
        } else {
          break; // Streak broken
        }
      }
      // If not due, just skip that day (don't break streak)
      
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Safety: don't go back more than a year
      if (today - checkDate > 365 * 24 * 60 * 60 * 1000) break;
    }
    
    return streak;
  },
  
  // Calculate streak for xTimesPerWeek habits
  calculateWeeklyStreak(habit) {
    const target = habit.timesPerPeriod || 3;
    const completionLog = habit.completionLog || [];
    
    let streak = 0;
    let checkWeekStart = this.getWeekStart(new Date());
    
    // Check current week progress
    const now = new Date();
    const currentWeekEnd = new Date(checkWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    
    const completedThisWeek = completionLog.filter(d => {
      const date = new Date(d);
      return date >= checkWeekStart && date <= currentWeekEnd;
    }).length;
    
    // If current week is already successful, count it
    if (completedThisWeek >= target) {
      streak++;
    }
    
    // Go back through previous weeks
    checkWeekStart.setDate(checkWeekStart.getDate() - 7);
    
    while (true) {
      const weekEnd = new Date(checkWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const completedInWeek = completionLog.filter(d => {
        const date = new Date(d);
        return date >= checkWeekStart && date <= weekEnd;
      }).length;
      
      if (completedInWeek >= target) {
        streak++;
      } else {
        break;
      }
      
      checkWeekStart.setDate(checkWeekStart.getDate() - 7);
      
      // Safety: don't go back more than a year
      if (streak > 52) break;
    }
    
    return streak;
  },
  
  // Calculate streak for xTimesPerMonth habits  
  calculateMonthlyStreak(habit) {
    const target = habit.timesPerPeriod || 10;
    const completionLog = habit.completionLog || [];
    
    let streak = 0;
    const now = new Date();
    let checkMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Check current month progress
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const completedThisMonth = completionLog.filter(d => {
      const date = new Date(d);
      return date >= checkMonth && date <= currentMonthEnd;
    }).length;
    
    if (completedThisMonth >= target) {
      streak++;
    }
    
    // Go back through previous months
    checkMonth.setMonth(checkMonth.getMonth() - 1);
    
    while (true) {
      const monthEnd = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 0);
      
      const completedInMonth = completionLog.filter(d => {
        const date = new Date(d);
        return date >= checkMonth && date <= monthEnd;
      }).length;
      
      if (completedInMonth >= target) {
        streak++;
      } else {
        break;
      }
      
      checkMonth.setMonth(checkMonth.getMonth() - 1);
      
      // Safety: don't go back more than 2 years
      if (streak > 24) break;
    }
    
    return streak;
  },
  
  // Toggle habit for today
  toggleHabit(habitId) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completionLog?.includes(today);
    
    // For everyXDays habits, check if actually due today
    if (habit.frequency === 'everyXDays' && !this.isHabitDueOnDate(habit, today)) {
      NexusUI.showToast('Dieser Habit ist heute nicht fällig', 'info');
      return;
    }
    
    if (isCompleted) {
      // Remove completion
      const newLog = habit.completionLog.filter(d => d !== today);
      const updatedHabit = { ...habit, completionLog: newLog };
      NexusStore.updateHabit(habitId, {
        completionLog: newLog,
        streak: this.calculateStreak(updatedHabit)
      });
    } else {
      // Add completion
      const newLog = [...(habit.completionLog || []), today];
      const updatedHabit = { ...habit, completionLog: newLog };
      const newStreak = this.calculateStreak(updatedHabit);
      
      NexusStore.updateHabit(habitId, {
        completionLog: newLog,
        streak: newStreak,
        bestStreak: Math.max(habit.bestStreak || 0, newStreak)
      });
    }
    
    this.render();
  },
  
  // Toggle habit for specific date
  toggleHabitDate(habitId, dateStr) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
    const completionLog = habit.completionLog || [];
    const isCompleted = completionLog.includes(dateStr);
    
    let newLog;
    if (isCompleted) {
      newLog = completionLog.filter(d => d !== dateStr);
    } else {
      newLog = [...completionLog, dateStr];
    }
    
    const updatedHabit = { ...habit, completionLog: newLog };
    const newStreak = this.calculateStreak(updatedHabit);
    
    NexusStore.updateHabit(habitId, {
      completionLog: newLog,
      streak: newStreak,
      bestStreak: Math.max(habit.bestStreak || 0, newStreak)
    });
    
    this.render();
  },
  
  // Show add habit modal
  showAddHabitModal() {
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Name</label>
          <input type="text" class="input" id="new-habit-name" placeholder="z.B. Meditation">
        </div>
        <div class="mb-4">
          <label class="input-label">Icon</label>
          <input type="text" class="input" id="new-habit-icon" placeholder="🧘" value="🔄">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="new-habit-description" rows="2" placeholder="Optional"></textarea>
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Frequenz</label>
            <select class="input" id="new-habit-frequency">
              <option value="daily">📅 Täglich</option>
              <option value="weekdays">💼 Werktags (Mo-Fr)</option>
              <option value="weekends">🌴 Wochenende (Sa-So)</option>
              <option value="weekly">📆 Bestimmte Wochentage</option>
              <option value="everyXDays">🔄 Alle X Tage</option>
              <option value="xTimesPerWeek">🎯 X mal pro Woche</option>
              <option value="xTimesPerMonth">📊 X mal pro Monat</option>
              <option value="monthlyDays">📅 Bestimmte Monatstage</option>
            </select>
          </div>
          <div>
            <label class="input-label">Sphäre</label>
            <select class="input" id="new-habit-sphere">
              <option value="">Keine</option>
              <option value="geschaeft">💼 Geschäft</option>
              <option value="projekte">🚀 Projekte</option>
              <option value="schule">📚 Schule</option>
              <option value="sport">💪 Sport</option>
              <option value="freizeit">🎮 Freizeit</option>
            </select>
          </div>
        </div>
        
        <!-- Weekly days selection -->
        <div class="mb-4 frequency-options" id="weekly-days-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Wochentage auswählen</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => {
              const value = i === 6 ? 0 : i + 1; // Convert to JS day index (So=0, Mo=1, etc.)
              return `
                <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
                  <input type="checkbox" class="weekday-check" value="${value}"> ${day}
                </label>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Every X days -->
        <div class="mb-4 frequency-options" id="every-x-days-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Alle wie viele Tage?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <span>Alle</span>
            <input type="number" class="input" id="new-habit-interval-days" value="2" min="2" max="30" style="width: 80px;">
            <span>Tage</span>
          </div>
          <p class="text-xs text-tertiary mt-2">Der Zyklus startet ab dem Erstellungsdatum</p>
        </div>
        
        <!-- X times per week -->
        <div class="mb-4 frequency-options" id="x-times-week-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Wie oft pro Woche?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <input type="number" class="input" id="new-habit-times-week" value="3" min="1" max="7" style="width: 80px;">
            <span>mal pro Woche</span>
          </div>
          <p class="text-xs text-tertiary mt-2">Du kannst selbst wählen an welchen Tagen</p>
        </div>
        
        <!-- X times per month -->
        <div class="mb-4 frequency-options" id="x-times-month-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Wie oft pro Monat?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <input type="number" class="input" id="new-habit-times-month" value="10" min="1" max="31" style="width: 80px;">
            <span>mal pro Monat</span>
          </div>
          <p class="text-xs text-tertiary mt-2">Flexible Verteilung über den Monat</p>
        </div>
        
        <!-- Monthly days selection -->
        <div class="mb-4 frequency-options" id="monthly-days-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Monatstage auswählen</label>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 8px;">
            ${Array.from({length: 31}, (_, i) => i + 1).map(day => `
              <label style="display: flex; align-items: center; justify-content: center; padding: 8px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
                <input type="checkbox" class="monthday-check" value="${day}" style="display: none;">
                <span class="monthday-label">${day}</span>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="HabitsModule.createHabit()">Erstellen</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Neuer Habit', content);
    
    // Add event listener for frequency change
    setTimeout(() => {
      this.setupFrequencyOptionsListeners('new');
    }, 100);
  },
  
  // Setup frequency options listeners
  setupFrequencyOptionsListeners(prefix) {
    const frequencySelect = document.getElementById(`${prefix}-habit-frequency`);
    if (!frequencySelect) return;
    
    const updateVisibility = () => {
      // Hide all option containers
      document.querySelectorAll('.frequency-options').forEach(el => el.style.display = 'none');
      
      const frequency = frequencySelect.value;
      
      // Show relevant container
      switch (frequency) {
        case 'weekly':
          document.getElementById('weekly-days-container').style.display = 'block';
          break;
        case 'everyXDays':
          document.getElementById('every-x-days-container').style.display = 'block';
          break;
        case 'xTimesPerWeek':
          document.getElementById('x-times-week-container').style.display = 'block';
          break;
        case 'xTimesPerMonth':
          document.getElementById('x-times-month-container').style.display = 'block';
          break;
        case 'monthlyDays':
          document.getElementById('monthly-days-container').style.display = 'block';
          break;
      }
    };
    
    frequencySelect.addEventListener('change', updateVisibility);
    updateVisibility(); // Initial update
    
    // Setup monthly days toggle styling
    document.querySelectorAll('.monthday-check').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const label = checkbox.closest('label');
        if (checkbox.checked) {
          label.style.background = 'var(--color-primary)';
          label.style.color = 'white';
        } else {
          label.style.background = 'var(--color-surface-2)';
          label.style.color = '';
        }
      });
    });
  },
  
  // Create habit
  createHabit() {
    const name = document.getElementById('new-habit-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const frequency = document.getElementById('new-habit-frequency')?.value || 'daily';
    
    // Build habit object based on frequency
    const habit = {
      name,
      icon: document.getElementById('new-habit-icon')?.value || '🔄',
      description: document.getElementById('new-habit-description')?.value || '',
      frequency,
      sphere: document.getElementById('new-habit-sphere')?.value || null,
      streak: 0,
      completionLog: [],
      startDate: new Date().toISOString().split('T')[0]
    };
    
    // Handle frequency-specific options
    switch (frequency) {
      case 'weekly':
        const weekdayChecks = document.querySelectorAll('.weekday-check:checked');
        habit.scheduledDays = Array.from(weekdayChecks).map(cb => parseInt(cb.value));
        if (habit.scheduledDays.length === 0) {
          NexusUI.showToast('Bitte mindestens einen Wochentag auswählen', 'error');
          return;
        }
        break;
        
      case 'everyXDays':
        const intervalDays = parseInt(document.getElementById('new-habit-interval-days')?.value) || 2;
        if (intervalDays < 2 || intervalDays > 30) {
          NexusUI.showToast('Intervall muss zwischen 2 und 30 Tagen liegen', 'error');
          return;
        }
        habit.intervalDays = intervalDays;
        break;
        
      case 'xTimesPerWeek':
        const timesWeek = parseInt(document.getElementById('new-habit-times-week')?.value) || 3;
        if (timesWeek < 1 || timesWeek > 7) {
          NexusUI.showToast('Muss zwischen 1 und 7 mal pro Woche sein', 'error');
          return;
        }
        habit.timesPerPeriod = timesWeek;
        break;
        
      case 'xTimesPerMonth':
        const timesMonth = parseInt(document.getElementById('new-habit-times-month')?.value) || 10;
        if (timesMonth < 1 || timesMonth > 31) {
          NexusUI.showToast('Muss zwischen 1 und 31 mal pro Monat sein', 'error');
          return;
        }
        habit.timesPerPeriod = timesMonth;
        break;
        
      case 'monthlyDays':
        const monthDayChecks = document.querySelectorAll('.monthday-check:checked');
        habit.monthDays = Array.from(monthDayChecks).map(cb => parseInt(cb.value)).sort((a, b) => a - b);
        if (habit.monthDays.length === 0) {
          NexusUI.showToast('Bitte mindestens einen Monatstag auswählen', 'error');
          return;
        }
        break;
    }
    
    NexusStore.addHabit(habit);
    NexusUI.closeModal();
    NexusUI.showToast('Habit erstellt!', 'success');
    this.render();
  },
  
  // Edit habit
  editHabit(habitId) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
    // Check which weekdays are selected
    const weekdayChecked = (day) => habit.scheduledDays?.includes(day) ? 'checked' : '';
    const monthdayChecked = (day) => habit.monthDays?.includes(day) ? 'checked' : '';
    const monthdayStyle = (day) => habit.monthDays?.includes(day) ? 
      'background: var(--color-primary); color: white;' : 
      'background: var(--color-surface-2);';
    
    const content = `
      <div class="p-4">
        <div class="mb-4">
          <label class="input-label">Name</label>
          <input type="text" class="input" id="edit-habit-name" value="${habit.name}">
        </div>
        <div class="mb-4">
          <label class="input-label">Icon</label>
          <input type="text" class="input" id="edit-habit-icon" value="${habit.icon || '🔄'}">
        </div>
        <div class="mb-4">
          <label class="input-label">Beschreibung</label>
          <textarea class="input" id="edit-habit-description" rows="2">${habit.description || ''}</textarea>
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div>
            <label class="input-label">Frequenz</label>
            <select class="input" id="edit-habit-frequency">
              <option value="daily" ${habit.frequency === 'daily' ? 'selected' : ''}>📅 Täglich</option>
              <option value="weekdays" ${habit.frequency === 'weekdays' ? 'selected' : ''}>💼 Werktags (Mo-Fr)</option>
              <option value="weekends" ${habit.frequency === 'weekends' ? 'selected' : ''}>🌴 Wochenende (Sa-So)</option>
              <option value="weekly" ${habit.frequency === 'weekly' ? 'selected' : ''}>📆 Bestimmte Wochentage</option>
              <option value="everyXDays" ${habit.frequency === 'everyXDays' ? 'selected' : ''}>🔄 Alle X Tage</option>
              <option value="xTimesPerWeek" ${habit.frequency === 'xTimesPerWeek' ? 'selected' : ''}>🎯 X mal pro Woche</option>
              <option value="xTimesPerMonth" ${habit.frequency === 'xTimesPerMonth' ? 'selected' : ''}>📊 X mal pro Monat</option>
              <option value="monthlyDays" ${habit.frequency === 'monthlyDays' ? 'selected' : ''}>📅 Bestimmte Monatstage</option>
            </select>
          </div>
          <div>
            <label class="input-label">Sphäre</label>
            <select class="input" id="edit-habit-sphere">
              <option value="">Keine</option>
              <option value="geschaeft" ${habit.sphere === 'geschaeft' ? 'selected' : ''}>💼 Geschäft</option>
              <option value="projekte" ${habit.sphere === 'projekte' ? 'selected' : ''}>🚀 Projekte</option>
              <option value="schule" ${habit.sphere === 'schule' ? 'selected' : ''}>📚 Schule</option>
              <option value="sport" ${habit.sphere === 'sport' ? 'selected' : ''}>💪 Sport</option>
              <option value="freizeit" ${habit.sphere === 'freizeit' ? 'selected' : ''}>🎮 Freizeit</option>
            </select>
          </div>
        </div>
        
        <!-- Weekly days selection -->
        <div class="mb-4 frequency-options" id="weekly-days-container" style="display: ${habit.frequency === 'weekly' ? 'block' : 'none'}; margin-top: 16px;">
          <label class="input-label">Wochentage auswählen</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => {
              const value = i === 6 ? 0 : i + 1;
              return `
                <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
                  <input type="checkbox" class="weekday-check" value="${value}" ${weekdayChecked(value)}> ${day}
                </label>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Every X days -->
        <div class="mb-4 frequency-options" id="every-x-days-container" style="display: ${habit.frequency === 'everyXDays' ? 'block' : 'none'}; margin-top: 16px;">
          <label class="input-label">Alle wie viele Tage?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <span>Alle</span>
            <input type="number" class="input" id="edit-habit-interval-days" value="${habit.intervalDays || 2}" min="2" max="30" style="width: 80px;">
            <span>Tage</span>
          </div>
          <p class="text-xs text-tertiary mt-2">Startdatum: ${habit.startDate || 'Heute'}</p>
        </div>
        
        <!-- X times per week -->
        <div class="mb-4 frequency-options" id="x-times-week-container" style="display: ${habit.frequency === 'xTimesPerWeek' ? 'block' : 'none'}; margin-top: 16px;">
          <label class="input-label">Wie oft pro Woche?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <input type="number" class="input" id="edit-habit-times-week" value="${habit.timesPerPeriod || 3}" min="1" max="7" style="width: 80px;">
            <span>mal pro Woche</span>
          </div>
        </div>
        
        <!-- X times per month -->
        <div class="mb-4 frequency-options" id="x-times-month-container" style="display: ${habit.frequency === 'xTimesPerMonth' ? 'block' : 'none'}; margin-top: 16px;">
          <label class="input-label">Wie oft pro Monat?</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
            <input type="number" class="input" id="edit-habit-times-month" value="${habit.timesPerPeriod || 10}" min="1" max="31" style="width: 80px;">
            <span>mal pro Monat</span>
          </div>
        </div>
        
        <!-- Monthly days selection -->
        <div class="mb-4 frequency-options" id="monthly-days-container" style="display: ${habit.frequency === 'monthlyDays' ? 'block' : 'none'}; margin-top: 16px;">
          <label class="input-label">Monatstage auswählen</label>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 8px;">
            ${Array.from({length: 31}, (_, i) => i + 1).map(day => `
              <label style="display: flex; align-items: center; justify-content: center; padding: 8px; ${monthdayStyle(day)} border-radius: 8px; cursor: pointer;">
                <input type="checkbox" class="monthday-check" value="${day}" ${monthdayChecked(day)} style="display: none;">
                <span class="monthday-label">${day}</span>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="HabitsModule.saveHabit('${habitId}')">Speichern</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Habit bearbeiten', content);
    
    // Setup listeners
    setTimeout(() => {
      this.setupFrequencyOptionsListeners('edit');
    }, 100);
  },
  
  // Save habit
  saveHabit(habitId) {
    const name = document.getElementById('edit-habit-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const frequency = document.getElementById('edit-habit-frequency')?.value || 'daily';
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    
    // Build update object
    const updates = {
      name,
      icon: document.getElementById('edit-habit-icon')?.value || '🔄',
      description: document.getElementById('edit-habit-description')?.value || '',
      frequency,
      sphere: document.getElementById('edit-habit-sphere')?.value || null
    };
    
    // Handle frequency-specific options
    switch (frequency) {
      case 'weekly':
        const weekdayChecks = document.querySelectorAll('.weekday-check:checked');
        updates.scheduledDays = Array.from(weekdayChecks).map(cb => parseInt(cb.value));
        if (updates.scheduledDays.length === 0) {
          NexusUI.showToast('Bitte mindestens einen Wochentag auswählen', 'error');
          return;
        }
        break;
        
      case 'everyXDays':
        updates.intervalDays = parseInt(document.getElementById('edit-habit-interval-days')?.value) || 2;
        // Keep original startDate if already set
        if (!habit.startDate) {
          updates.startDate = new Date().toISOString().split('T')[0];
        }
        break;
        
      case 'xTimesPerWeek':
        updates.timesPerPeriod = parseInt(document.getElementById('edit-habit-times-week')?.value) || 3;
        break;
        
      case 'xTimesPerMonth':
        updates.timesPerPeriod = parseInt(document.getElementById('edit-habit-times-month')?.value) || 10;
        break;
        
      case 'monthlyDays':
        const monthDayChecks = document.querySelectorAll('.monthday-check:checked');
        updates.monthDays = Array.from(monthDayChecks).map(cb => parseInt(cb.value)).sort((a, b) => a - b);
        if (updates.monthDays.length === 0) {
          NexusUI.showToast('Bitte mindestens einen Monatstag auswählen', 'error');
          return;
        }
        break;
    }
    
    NexusStore.updateHabit(habitId, updates);
    NexusUI.closeModal();
    NexusUI.showToast('Habit gespeichert!', 'success');
    this.render();
  },
  
  // Delete habit
  deleteHabit(habitId) {
    if (!confirm('Habit wirklich löschen? Alle Streak-Daten gehen verloren!')) return;
    NexusStore.deleteHabit(habitId);
    NexusUI.showToast('Habit gelöscht', 'success');
    this.render();
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      // View toggle
      const viewTab = e.target.closest('[data-view]');
      if (viewTab && e.target.closest('#page-habits')) {
        this.view = viewTab.dataset.view;
        this.render();
        return;
      }
      
      // Add habit buttons
      if (e.target.closest('#add-habit-btn') || e.target.closest('#add-habit-btn-empty')) {
        this.showAddHabitModal();
        return;
      }
      
      // Month view navigation
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'prev-month' && e.target.closest('#page-habits')) {
        this.monthOffset--;
        this.render();
        return;
      }
      if (action === 'next-month' && e.target.closest('#page-habits')) {
        this.monthOffset++;
        this.render();
        return;
      }
      
      // Month view habit selection
      if (action === 'toggle-habit-select' && e.target.closest('#page-habits')) {
        const habitId = e.target.closest('[data-habit-id]')?.dataset.habitId;
        if (habitId) {
          const idx = this.selectedHabits.indexOf(habitId);
          if (idx >= 0) {
            this.selectedHabits.splice(idx, 1);
          } else {
            this.selectedHabits.push(habitId);
          }
          this.render();
        }
        return;
      }
      if (action === 'select-all-habits' && e.target.closest('#page-habits')) {
        const habits = NexusStore.getHabits();
        if (this.selectedHabits.length === habits.length) {
          this.selectedHabits = [];
        } else {
          this.selectedHabits = habits.map(h => h.id);
        }
        this.render();
        return;
      }
      
      // Month view day click - toggle habits for that day
      if (action === 'toggle-day' && e.target.closest('#page-habits')) {
        const dateStr = e.target.closest('[data-date]')?.dataset.date;
        if (dateStr && this.selectedHabits.length > 0) {
          // Toggle all selected habits for this date
          this.selectedHabits.forEach(habitId => {
            this.toggleHabitDate(habitId, dateStr);
          });
        }
        return;
      }
      
      // Habit card actions
      const habitCard = e.target.closest('[data-habit-id]');
      if (habitCard && e.target.closest('#page-habits')) {
        const habitId = habitCard.dataset.habitId;
        
        if (action === 'toggle') {
          this.toggleHabit(habitId);
        } else if (action === 'toggle-date') {
          const dateStr = e.target.closest('[data-date]')?.dataset.date;
          if (dateStr) this.toggleHabitDate(habitId, dateStr);
        } else if (action === 'edit') {
          this.editHabit(habitId);
        } else if (action === 'delete') {
          this.deleteHabit(habitId);
        }
        return;
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'habits') {
    HabitsModule.init();
  }
});

// Export
window.HabitsModule = HabitsModule;
