/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Habits Module
   Full habit tracking view
   ═══════════════════════════════════════════════════════════════════════════════ */

const HabitsModule = {
  
  view: 'today', // today | week | all
  _listenersInitialized: false,
  
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
          <p class="text-secondary">${stats.completedToday}/${habits.length} heute erledigt</p>
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
          <div class="stat-value">${stats.completedToday}/${habits.length}</div>
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
        <button class="tab ${this.view === 'all' ? 'active' : ''}" data-view="all">Alle Habits</button>
      </div>
      
      <!-- Content -->
      ${this.view === 'today' ? this.renderTodayView(habits) :
        this.view === 'week' ? this.renderWeekView(habits) :
        this.renderAllView(habits)}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Get stats
  getStats(habits) {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.completionLog?.includes(today)).length;
    
    // Week stats
    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekDays.push(d.toISOString().split('T')[0]);
    }
    
    let weekCompleted = 0;
    let weekTotal = habits.length * 7;
    habits.forEach(h => {
      weekDays.forEach(day => {
        if (h.completionLog?.includes(day)) weekCompleted++;
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
    
    return { completedToday, weekPercentage, longestStreak, currentStreak };
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
    
    const pending = habits.filter(h => !h.completionLog?.includes(today));
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
    return `
      <div class="habit-card ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
        <div class="flex items-center gap-4">
          <button class="habit-check ${isCompleted ? 'checked' : ''}" data-action="toggle">
            ${isCompleted ? '✓' : ''}
          </button>
          
          <div class="habit-icon text-2xl">${habit.icon || '🔄'}</div>
          
          <div class="flex-1 min-w-0">
            <div class="habit-name font-medium ${isCompleted ? 'text-tertiary' : ''}">${habit.name}</div>
            <div class="flex items-center gap-3 text-xs text-tertiary mt-1">
              <span>${this.getFrequencyLabel(habit.frequency, habit.scheduledDays)}</span>
              ${habit.streak > 0 ? `<span class="text-warning">🔥 ${habit.streak} Tage</span>` : ''}
            </div>
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
      const dayName = d.toLocaleDateString('de-DE', { weekday: 'narrow' });
      
      days.push(`
        <div class="habit-day ${isCompleted ? 'completed' : ''}" title="${d.toLocaleDateString('de-DE')}">
          <div class="habit-day-name">${dayName}</div>
          <div class="habit-day-dot ${isCompleted ? 'filled' : ''}"></div>
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
                        <span>${this.getFrequencyLabel(habit.frequency, habit.scheduledDays)}</span>
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
  getFrequencyLabel(frequency, scheduledDays = null) {
    if (frequency === 'weekly' && scheduledDays && scheduledDays.length > 0) {
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const days = scheduledDays.map(d => dayNames[d]).join(', ');
      return `📆 Wöchentlich (${days})`;
    }
    
    const labels = {
      daily: '📅 Täglich',
      weekly: '📆 Wöchentlich',
      weekdays: '💼 Werktags',
      custom: '⚙️ Benutzerdefiniert'
    };
    return labels[frequency] || frequency || '📅 Täglich';
  },
  
  // Get success rate
  getSuccessRate(habit) {
    if (!habit.createdAt) return 0;
    
    const start = new Date(habit.createdAt);
    const now = new Date();
    const days = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 100;
    
    const completed = habit.completionLog?.length || 0;
    return Math.round((completed / days) * 100);
  },
  
  // Toggle habit for today
  toggleHabit(habitId) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completionLog?.includes(today);
    
    if (isCompleted) {
      // Remove completion
      NexusStore.updateHabit(habitId, {
        completionLog: habit.completionLog.filter(d => d !== today),
        streak: Math.max(0, (habit.streak || 0) - 1)
      });
    } else {
      // Add completion
      NexusStore.completeHabit(habitId);
    }
    
    this.render();
  },
  
  // Toggle habit for specific date
  toggleHabitDate(habitId, dateStr) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
    const completionLog = habit.completionLog || [];
    const isCompleted = completionLog.includes(dateStr);
    
    if (isCompleted) {
      NexusStore.updateHabit(habitId, {
        completionLog: completionLog.filter(d => d !== dateStr)
      });
    } else {
      NexusStore.updateHabit(habitId, {
        completionLog: [...completionLog, dateStr]
      });
    }
    
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
              <option value="daily">Täglich</option>
              <option value="weekdays">Werktags</option>
              <option value="weekly">Wöchentlich</option>
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
        <div class="mb-4" id="weekly-days-container" style="display: none; margin-top: 16px;">
          <label class="input-label">Wochentage auswählen</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="1"> Mo
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="2"> Di
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="3"> Mi
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="4"> Do
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="5"> Fr
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="6"> Sa
            </label>
            <label style="display: flex; align-items: center; gap: 4px; padding: 8px 12px; background: var(--color-surface-2); border-radius: 8px; cursor: pointer;">
              <input type="checkbox" class="weekday-check" value="0"> So
            </label>
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
      const frequencySelect = document.getElementById('new-habit-frequency');
      const weeklyDaysContainer = document.getElementById('weekly-days-container');
      if (frequencySelect && weeklyDaysContainer) {
        frequencySelect.addEventListener('change', (e) => {
          weeklyDaysContainer.style.display = e.target.value === 'weekly' ? 'block' : 'none';
        });
      }
    }, 100);
  },
  
  // Create habit
  createHabit() {
    const name = document.getElementById('new-habit-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    const frequency = document.getElementById('new-habit-frequency')?.value || 'daily';
    
    // Get selected weekdays for weekly habits
    let scheduledDays = null;
    if (frequency === 'weekly') {
      const checkedBoxes = document.querySelectorAll('.weekday-check:checked');
      scheduledDays = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
      if (scheduledDays.length === 0) {
        NexusUI.showToast('Bitte mindestens einen Wochentag auswählen', 'error');
        return;
      }
    }
    
    const habit = {
      name,
      icon: document.getElementById('new-habit-icon')?.value || '🔄',
      description: document.getElementById('new-habit-description')?.value || '',
      frequency,
      scheduledDays,
      sphere: document.getElementById('new-habit-sphere')?.value || null,
      streak: 0,
      completionLog: []
    };
    
    NexusStore.addHabit(habit);
    NexusUI.closeModal();
    NexusUI.showToast('Habit erstellt!', 'success');
    this.render();
  },
  
  // Edit habit
  editHabit(habitId) {
    const habit = NexusStore.getHabits().find(h => h.id === habitId);
    if (!habit) return;
    
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
              <option value="daily" ${habit.frequency === 'daily' ? 'selected' : ''}>Täglich</option>
              <option value="weekdays" ${habit.frequency === 'weekdays' ? 'selected' : ''}>Werktags</option>
              <option value="weekly" ${habit.frequency === 'weekly' ? 'selected' : ''}>Wöchentlich</option>
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
        <div class="flex gap-2 justify-end mt-6">
          <button class="btn btn-secondary" onclick="NexusUI.closeModal()">Abbrechen</button>
          <button class="btn btn-primary" onclick="HabitsModule.saveHabit('${habitId}')">Speichern</button>
        </div>
      </div>
    `;
    
    NexusUI.openModal('Habit bearbeiten', content);
  },
  
  // Save habit
  saveHabit(habitId) {
    const name = document.getElementById('edit-habit-name')?.value;
    if (!name) {
      NexusUI.showToast('Name ist erforderlich', 'error');
      return;
    }
    
    NexusStore.updateHabit(habitId, {
      name,
      icon: document.getElementById('edit-habit-icon')?.value || '🔄',
      description: document.getElementById('edit-habit-description')?.value || '',
      frequency: document.getElementById('edit-habit-frequency')?.value || 'daily',
      sphere: document.getElementById('edit-habit-sphere')?.value || null
    });
    
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
      
      // Habit card actions
      const habitCard = e.target.closest('[data-habit-id]');
      if (habitCard && e.target.closest('#page-habits')) {
        const habitId = habitCard.dataset.habitId;
        const action = e.target.closest('[data-action]')?.dataset.action;
        
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
