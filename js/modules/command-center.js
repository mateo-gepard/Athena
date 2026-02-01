/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Command Center Module
   Das tägliche Mission Control
   ═══════════════════════════════════════════════════════════════════════════════ */

const CommandCenter = {
  
  // Initialize Command Center
  init() {
    this.render();
    this.setupEventListeners();
    
    // Subscribe to store changes
    NexusStore.subscribe((action, data) => {
      if (action.startsWith('task:') || action.startsWith('habit:')) {
        this.render();
      }
    });
  },
  
  // Render all sections
  render() {
    this.renderGreeting();
    this.renderHeaderStats();
    this.renderFocusBlock();
    this.reorderTimeBlocksByCurrentTime(); // Ordne Blöcke dynamisch
    this.renderTimeBlocks();
    this.renderHabits();
    this.renderAlerts();
    this.renderUpcoming();
    NexusUI.refreshIcons();
  },
  
  // Ordne Zeitblöcke basierend auf der aktuellen Tageszeit
  reorderTimeBlocksByCurrentTime() {
    const timeline = document.querySelector('.cc-timeline');
    if (!timeline) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Bestimme aktuellen Block
    let currentBlock = 'morning';
    if (currentHour >= 6 && currentHour < 12) {
      currentBlock = 'morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      currentBlock = 'afternoon';
    } else if (currentHour >= 18 && currentHour < 24) {
      currentBlock = 'evening';
    } else {
      // Nach Mitternacht bis 6 Uhr -> zeige morning zuerst
      currentBlock = 'morning';
    }
    
    // Finde alle Zeitblock-Elemente
    const focusBlock = timeline.querySelector('.cc-focus-block');
    const morningBlock = Array.from(timeline.children).find(el => 
      el.querySelector('#morningTasks')
    );
    const afternoonBlock = Array.from(timeline.children).find(el => 
      el.querySelector('#afternoonTasks')
    );
    const eveningBlock = Array.from(timeline.children).find(el => 
      el.querySelector('#eveningTasks')
    );
    
    if (!morningBlock || !afternoonBlock || !eveningBlock) return;
    
    // Entferne alle Blöcke (außer Focus)
    if (morningBlock.parentNode) morningBlock.remove();
    if (afternoonBlock.parentNode) afternoonBlock.remove();
    if (eveningBlock.parentNode) eveningBlock.remove();
    
    // Füge in richtiger Reihenfolge wieder ein
    if (currentBlock === 'morning') {
      timeline.appendChild(morningBlock);
      timeline.appendChild(afternoonBlock);
      timeline.appendChild(eveningBlock);
    } else if (currentBlock === 'afternoon') {
      timeline.appendChild(afternoonBlock);
      timeline.appendChild(eveningBlock);
      timeline.appendChild(morningBlock);
    } else { // evening
      timeline.appendChild(eveningBlock);
      timeline.appendChild(morningBlock);
      timeline.appendChild(afternoonBlock);
    }
    
    // Highlight aktuellen Block
    [morningBlock, afternoonBlock, eveningBlock].forEach(block => {
      block.classList.remove('cc-time-block-current');
    });
    
    if (currentBlock === 'morning') {
      morningBlock.classList.add('cc-time-block-current');
    } else if (currentBlock === 'afternoon') {
      afternoonBlock.classList.add('cc-time-block-current');
    } else {
      eveningBlock.classList.add('cc-time-block-current');
    }
  },
  
  // Render Greeting
  renderGreeting() {
    const greetingEl = document.getElementById('cc-greeting');
    const dateTimeEl = document.getElementById('cc-date-time');
    const motivationEl = document.getElementById('cc-motivation');
    if (!greetingEl || !dateTimeEl) return;
    
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    
    // Get username from AuthService or fallback
    let userName = 'Nutzer';
    if (window.AuthService && AuthService.user) {
      userName = AuthService.user.displayName || AuthService.user.email.split('@')[0];
    }
    
    greetingEl.textContent = `${greeting}, ${userName}!`;
    
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    dateTimeEl.textContent = `${dayName}, ${day}. ${month} ${year} · ${time}`;
    
    // Dynamic motivation based on time of day
    if (motivationEl) {
      let motivation = '';
      if (hour < 12) {
        motivation = 'Heute ist ein guter Tag, um Großes zu erreichen.';
      } else if (hour < 18) {
        motivation = 'Der Tag ist noch jung – nutze die Zeit weise.';
      } else {
        motivation = 'Ein erfolgreicher Tag endet mit Reflexion und Dankbarkeit.';
      }
      motivationEl.textContent = motivation;
    }
  },
  
  // Render Header Stats
  renderHeaderStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = NexusStore.getTasksForDate(today);
    const completedToday = todayTasks.filter(t => t.status === 'completed');
    const openTasks = todayTasks.filter(t => t.status !== 'completed');
    const habitsDueToday = NexusStore.getHabitsDueToday();
    const completedHabits = habitsDueToday.filter(h => NexusStore.isHabitCompletedToday(h.id));
    const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
    
    const completionRate = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;
    
    const statCompletion = document.getElementById('cc-stat-completion');
    if (statCompletion) {
      statCompletion.querySelector('.cc-stat-value').textContent = `${completionRate}%`;
    }
    
    const statTasks = document.getElementById('cc-stat-tasks');
    if (statTasks) {
      statTasks.querySelector('.cc-stat-value').textContent = openTasks.length;
    }
    
    const statHabits = document.getElementById('cc-stat-habits');
    if (statHabits) {
      statHabits.querySelector('.cc-stat-value').textContent = `${completedHabits.length}/${habitsDueToday.length}`;
    }
    
    const statFocus = document.getElementById('cc-stat-focus');
    if (statFocus) {
      const hours = (totalMinutes / 60).toFixed(1);
      statFocus.querySelector('.cc-stat-value').textContent = `${hours}h`;
    }
  },
  
  // Convert old priority strings to scores 1-10
  priorityToScore(priority) {
    const map = { critical: 9, high: 7, medium: 5, normal: 5, low: 3 };
    return map[priority] || 5;
  },
  
  // Render Focus Block (Highest Priority Task)
  renderFocusBlock() {
    const container = document.getElementById('cc-focus-task');
    const timeEl = document.getElementById('cc-focus-time');
    if (!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = NexusStore.getTasksForDate(today).filter(t => t.status !== 'completed');
    
    // Sort by effective priority (considers deadline urgency)
    const focusTask = todayTasks.sort((a, b) => {
      const scoreA = NexusStore.getEffectivePriority(a);
      const scoreB = NexusStore.getEffectivePriority(b);
      return scoreB - scoreA;
    })[0];
    
    if (!focusTask) {
      container.innerHTML = `
        <div class="cc-focus-empty">
          <i data-lucide="check-circle"></i>
          <div>Keine Tasks für heute geplant</div>
        </div>
      `;
      if (timeEl) timeEl.textContent = '0h';
      NexusUI.refreshIcons();
      return;
    }
    
    container.innerHTML = this.renderTaskCard(focusTask);
    if (timeEl) {
      const time = focusTask.timeEstimate ? `${(focusTask.timeEstimate / 60).toFixed(1)}h` : '0h';
      timeEl.textContent = time;
    }
  },
  
  // Render Time Blocks (Morning, Afternoon, Evening)
  renderTimeBlocks() {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    
    // Get all tasks for today (scheduled)
    const scheduledTasks = NexusStore.getTasksForDate(today);
    
    // Get deadline tasks that are due today or past (needs attention)
    const overdueTasks = NexusStore.getOverdueTasks();
    
    // Get deadline tasks due tomorrow (high priority)
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const urgentDeadlineTasks = NexusStore.getTasks().filter(t => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      // Due today or tomorrow but not already scheduled today
      return (t.deadline === today || t.deadline === tomorrowStr) && !t.scheduledDate;
    });
    
    // Get someday tasks with commandCenterBlock assignment
    const somedayInBlocks = NexusStore.getTasks().filter(t => {
      if (t.status === 'completed') return false;
      if (t.taskType !== 'someday' && t.taskType !== 'deadline') return false;
      return t.commandCenterBlock && !t.scheduledDate;
    });
    
    // Combine all tasks
    const allTasks = [...scheduledTasks];
    
    // Add urgent deadline tasks if not already in scheduled
    urgentDeadlineTasks.forEach(t => {
      if (!allTasks.find(st => st.id === t.id)) {
        allTasks.push(t);
      }
    });
    
    // Add someday tasks with block assignment
    somedayInBlocks.forEach(t => {
      if (!allTasks.find(st => st.id === t.id)) {
        allTasks.push(t);
      }
    });
    
    // Sort tasks by scheduled time (if available) then by effective priority
    allTasks.sort((a, b) => {
      // First by scheduled time
      if (a.scheduledTime && !b.scheduledTime) return -1;
      if (!a.scheduledTime && b.scheduledTime) return 1;
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime);
      }
      // Then by effective priority (higher first)
      const prioA = NexusStore.getEffectivePriority(a);
      const prioB = NexusStore.getEffectivePriority(b);
      return prioB - prioA;
    });
    
    // Categorize by time block
    const blocks = {
      needsAttention: [], // Overdue or due today
      morning: [],        // 06:00 - 12:00
      afternoon: [],      // 12:00 - 18:00
      evening: []         // 18:00 - 22:00
    };
    
    allTasks.forEach(task => {
      // Check if overdue or due today (needs attention)
      if (task.deadline) {
        const deadlineDate = task.deadline.split('T')[0];
        if (deadlineDate <= today && task.status !== 'completed') {
          blocks.needsAttention.push(task);
          return;
        }
      }
      
      // If task has commandCenterBlock assignment, use that
      if (task.commandCenterBlock) {
        const block = task.commandCenterBlock;
        if (blocks[block]) {
          blocks[block].push(task);
          return;
        }
      }
      
      // Otherwise use scheduled time
      if (!task.scheduledTime) {
        // Default deadline/someday tasks to morning if no block assigned
        blocks.morning.push(task);
        return;
      }
      
      const hour = parseInt(task.scheduledTime.split(':')[0]);
      if (hour < 12) {
        blocks.morning.push(task);
      } else if (hour < 18) {
        blocks.afternoon.push(task);
      } else {
        blocks.evening.push(task);
      }
    });
    
    // Render each block
    this.renderNeedsAttentionBlock(blocks.needsAttention);
    this.renderBlock('morningTasks', blocks.morning);
    this.renderBlock('afternoonTasks', blocks.afternoon);
    this.renderBlock('eveningTasks', blocks.evening);
  },
  
  // Render Needs Attention Block (Overdue & Due Today)
  renderNeedsAttentionBlock(tasks) {
    const container = document.getElementById('needsAttentionTasks');
    const countEl = document.getElementById('cc-needsAttention-count');
    const sectionEl = document.getElementById('cc-needsAttention-section');
    
    if (countEl) {
      countEl.textContent = tasks.length;
    }
    
    // Hide section if no tasks need attention
    if (sectionEl) {
      sectionEl.style.display = tasks.length > 0 ? 'block' : 'none';
    }
    
    if (!container) return;
    
    if (tasks.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = tasks.map(task => this.renderTaskCard(task, true)).join('');
    NexusUI.refreshIcons();
  },
  
  // Render a single time block
  renderBlock(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Update count
    const blockName = containerId.replace('Tasks', '');
    const countEl = document.getElementById(`cc-${blockName}-count`);
    if (countEl) {
      countEl.textContent = tasks.length;
    }
    
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="cc-timeline-empty">
          Keine Tasks in diesem Block
        </div>
      `;
      return;
    }
    
    // Add habits for this block
    const habits = NexusStore.getHabits();
    const now = new Date();
    const currentHour = now.getHours();
    
    // Determine time range for this block
    let minHour, maxHour;
    if (containerId === 'morningTasks') {
      minHour = 6; maxHour = 12;
    } else if (containerId === 'afternoonTasks') {
      minHour = 12; maxHour = 18;
    } else {
      minHour = 18; maxHour = 22;
    }
    
    // Get habits for this time block
    const blockHabits = habits.filter(h => {
      if (!h.preferredTime) return false;
      const habitHour = parseInt(h.preferredTime.split(':')[0]);
      return habitHour >= minHour && habitHour < maxHour;
    });
    
    // Combine and sort all items
    const allItems = [
      ...tasks.map(t => ({ type: 'task', data: t, time: t.scheduledTime })),
      ...blockHabits.map(h => ({ type: 'habit', data: h, time: h.preferredTime }))
    ].sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    
    container.innerHTML = allItems.map(item => {
      if (item.type === 'task') {
        return this.renderTaskCard(item.data);
      } else {
        return this.renderHabitCard(item.data);
      }
    }).join('');
    
    NexusUI.refreshIcons();
  },
  
  // Render Task Card (new style)
  renderTaskCard(task, isUrgent = false) {
    const isCompleted = task.status === 'completed';
    const sphere = task.spheres && task.spheres[0] ? task.spheres[0] : 'freizeit';
    const sphereColor = NexusUI.getSphereColor(sphere);
    
    // Use effective priority for deadline tasks
    const effectivePriority = NexusStore.getEffectivePriority(task);
    const priorityClass = effectivePriority >= 8 ? 'critical' : effectivePriority >= 6 ? 'high' : effectivePriority >= 4 ? 'medium' : 'low';
    const urgentClass = isUrgent ? 'urgent' : '';
    
    // Format time estimate
    const duration = task.timeEstimate || 0;
    const durationText = duration >= 60 ? `${(duration / 60).toFixed(1)}h` : duration > 0 ? `${duration}min` : '';
    
    // Task type indicator
    const typeIcons = { scheduled: '📅', deadline: '⏰', someday: '💭' };
    const typeIcon = typeIcons[task.taskType] || '';
    
    // Calculate end time for scheduled tasks
    let timeDisplay = '';
    if (task.scheduledTime) {
      const [h, m] = task.scheduledTime.split(':').map(Number);
      const endMin = (h * 60 + m) + (task.timeEstimate || 30);
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      timeDisplay = `${task.scheduledTime} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } else if (task.deadline) {
      const dl = new Date(task.deadline);
      timeDisplay = `Bis ${dl.getDate()}.${dl.getMonth() + 1}.`;
    }
    
    return `
      <div class="cc-task-card ${isCompleted ? 'completed' : ''} ${urgentClass}" 
           style="--sphere-color: ${sphereColor}"
           data-task-id="${task.id}"
           draggable="true">
        <div class="cc-task-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-task"></div>
        <div class="cc-task-content">
          <div class="cc-task-title">${isUrgent ? '⚠️ ' : ''}${typeIcon} ${task.title}</div>
          <div class="cc-task-meta">
            <span class="badge badge-${priorityClass}">${effectivePriority}/10</span>
            <span class="cc-task-meta-separator">·</span>
            <span class="badge badge-${sphere}">${sphere}</span>
            ${durationText ? `<span class="cc-task-meta-separator">·</span><span>${durationText}</span>` : ''}
          </div>
        </div>
        ${timeDisplay ? `
          <div class="cc-task-time">
            <i data-lucide="${task.scheduledTime ? 'clock' : 'calendar'}"></i>
            <span>${timeDisplay}</span>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  // Render Habit Card (new style)
  renderHabitCard(habit) {
    const isCompleted = NexusStore.isHabitCompletedToday(habit.id);
    
    return `
      <div class="cc-task-card ${isCompleted ? 'completed' : ''}" 
           data-habit-id="${habit.id}">
        <div class="cc-task-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-habit"></div>
        <div class="cc-task-content">
          <div class="cc-task-title">
            <span style="margin-right: 8px">${habit.icon}</span>
            ${habit.name}
          </div>
          <div class="cc-task-meta">
            <span class="badge">HABIT</span>
            <span class="cc-task-meta-separator">·</span>
            <span>Streak: ${habit.streak} <i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></i></span>
          </div>
        </div>
        ${habit.preferredTime ? `
          <div class="cc-task-time">
            <i data-lucide="clock"></i>
            <span>${habit.preferredTime}</span>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  
  // Render Habits (Sidebar Panel)
  renderHabits() {
    const container = document.getElementById('todayHabits');
    const badgeEl = document.getElementById('cc-habits-badge');
    if (!container) return;
    
    const habitsDueToday = NexusStore.getHabitsDueToday();
    const completedHabits = habitsDueToday.filter(h => NexusStore.isHabitCompletedToday(h.id));
    
    if (badgeEl) {
      badgeEl.textContent = `${completedHabits.length}/${habitsDueToday.length}`;
    }
    
    if (habitsDueToday.length === 0) {
      container.innerHTML = `
        <div class="cc-habits-empty">
          Heute keine Habits fällig
        </div>
      `;
      return;
    }
    
    container.innerHTML = habitsDueToday.map(habit => {
      const isCompleted = NexusStore.isHabitCompletedToday(habit.id);
      return `
        <div class="cc-habit-item ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
          <div class="cc-habit-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-habit"></div>
          <div class="cc-habit-icon">${habit.icon}</div>
          <div class="cc-habit-content">
            <div class="cc-habit-name">${habit.name}</div>
            <div class="cc-habit-streak">Streak: ${habit.streak} Tage ${habit.streak > 0 ? '<i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></i>' : ''}</div>
          </div>
        </div>
      `;
    }).join('');
    
    NexusUI.refreshIcons();
  },
  
  // Render Alerts (Overdue Tasks)
  renderAlerts() {
    const container = document.getElementById('cc-alerts');
    const badgeEl = document.getElementById('cc-alerts-badge');
    if (!container) return;
    
    const overdueTasks = NexusStore.getOverdueTasks();
    
    if (badgeEl) {
      badgeEl.textContent = overdueTasks.length;
    }
    
    if (overdueTasks.length === 0) {
      container.innerHTML = `
        <div class="cc-alerts-empty">
          <i data-lucide="check-circle"></i>
          <div>Alles erledigt!</div>
          <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Keine überfälligen Tasks</div>
        </div>
      `;
      NexusUI.refreshIcons();
      return;
    }
    
    container.innerHTML = overdueTasks.slice(0, 5).map(task => {
      const daysOverdue = Math.floor((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24));
      return `
        <div class="cc-alert-item" data-task-id="${task.id}">
          <div class="cc-alert-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="cc-alert-content">
            <div class="cc-alert-title">${task.title}</div>
            <div class="cc-alert-meta">${daysOverdue} ${daysOverdue === 1 ? 'Tag' : 'Tage'} überfällig</div>
          </div>
        </div>
      `;
    }).join('');
    
    NexusUI.refreshIcons();
  },
  
  // Render Upcoming (This Week)
  renderUpcoming() {
    const container = document.getElementById('weekTasks');
    const badgeEl = document.getElementById('cc-week-badge');
    if (!container) return;
    
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    const weekTasks = NexusStore.getTasks().filter(t => {
      if (t.status === 'completed') return false;
      if (t.scheduledDate === todayStr) return false;
      if (!t.deadline) return false;
      return t.deadline >= todayStr && t.deadline <= weekEndStr;
    });
    
    if (badgeEl) {
      badgeEl.textContent = weekTasks.length;
    }
    
    if (weekTasks.length === 0) {
      container.innerHTML = `
        <div class="cc-upcoming-empty">
          Keine Tasks diese Woche fällig
        </div>
      `;
      return;
    }
    
    container.innerHTML = weekTasks.slice(0, 8).map(task => {
      const deadline = new Date(task.deadline);
      const dayName = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][deadline.getDay()];
      const dateStr = `${dayName} ${deadline.getDate()}.${deadline.getMonth() + 1}`;
      
      return `
        <div class="cc-upcoming-item" data-task-id="${task.id}">
          <div class="cc-upcoming-dot"></div>
          <div class="cc-upcoming-content">
            <div class="cc-upcoming-title">${task.title}</div>
            <div class="cc-upcoming-date">${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');
    
    NexusUI.refreshIcons();
  },
  
  // Render habit in timeline format
  renderHabitInTimeline(habit) {
    const isCompleted = NexusStore.isHabitCompletedToday(habit.id);
    const sphereColor = NexusUI.getSphereColor(habit.spheres[0]);
    
    return `
      <div class="task-card ${isCompleted ? 'completed' : ''}" 
           style="--sphere-color: ${sphereColor}"
           data-habit-id="${habit.id}">
        <div class="task-checkbox ${isCompleted ? 'checked' : ''}" data-action="toggle-habit"></div>
        <div class="task-content">
          <div class="task-title">
            <span style="margin-right: 8px">${habit.icon}</span>
            ${habit.name}
          </div>
          <div class="task-meta">
            <span class="badge">HABIT</span>
            <span class="task-meta-separator">·</span>
            <span>Streak: ${habit.streak} ${habit.streak > 0 ? '<i data-lucide="flame"></i>' : ''}</span>
          </div>
        </div>
        <div class="task-time">
          <span class="mono">${habit.preferredTime || ''}</span>
        </div>
      </div>
    `;
  },
  
  // Render Task Pool (Overdue + This Week)
  renderTaskPool() {
    const overdueTasks = NexusStore.getOverdueTasks();
    const overdueContainer = document.getElementById('overdueTasks');
    const overdueBadge = document.getElementById('overdue-count-badge');
    
    if (overdueBadge) {
      overdueBadge.textContent = `Überfällig (${overdueTasks.length})`;
    }
    
    if (overdueContainer) {
      if (overdueTasks.length === 0) {
        overdueContainer.innerHTML = '<div class="text-tertiary">Keine überfälligen Tasks <i data-lucide="party-popper"></i></div>';
      } else {
        overdueContainer.innerHTML = overdueTasks.slice(0, 3).map(task => 
          this.renderPoolTask(task)
        ).join('');
      }
    }
    
    // This week tasks (not scheduled for today, but due this week)
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    const weekTasks = NexusStore.getTasks().filter(t => {
      if (t.status === 'completed') return false;
      if (t.scheduledDate === todayStr) return false; // Already scheduled today
      if (!t.deadline) return false;
      return t.deadline >= todayStr && t.deadline <= weekEndStr;
    });
    
    const weekContainer = document.getElementById('weekTasks');
    const weekBadge = document.getElementById('week-count-badge');
    
    if (weekBadge) {
      weekBadge.textContent = `Diese Woche (${weekTasks.length})`;
    }
    
    if (weekContainer) {
      if (weekTasks.length === 0) {
        weekContainer.innerHTML = '<div class="text-tertiary">Keine Tasks diese Woche fällig</div>';
      } else {
        weekContainer.innerHTML = weekTasks.slice(0, 3).map(task => 
          this.renderPoolTask(task)
        ).join('');
      }
    }
    
    NexusUI.refreshIcons();
  },
  
  // Render task in pool format (compact)
  renderPoolTask(task) {
    const sphereColor = NexusUI.getSphereColor(task.spheres[0]);
    
    return `
      <div class="flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer"
           style="border-left: 3px solid ${sphereColor}"
           data-task-id="${task.id}">
        <div class="flex-1 min-w-0">
          <div class="text-sm truncate">${task.title}</div>
        </div>
        <button class="btn btn-sm" data-action="schedule-today">+ Heute</button>
      </div>
    `;
  },
  
  // Render Habits
  renderHabits() {
    const container = document.getElementById('todayHabits');
    if (!container) return;
    
    const habits = NexusStore.getHabits();
    
    if (habits.length === 0) {
      container.innerHTML = NexusUI.renderEmptyState('repeat', 'Keine Habits', 'Erstelle dein erstes Habit!');
      return;
    }
    
    container.innerHTML = habits.map(habit => NexusUI.renderHabitCard(habit)).join('');
    NexusUI.refreshIcons();
  },
  
  // Render Quick Stats
  renderQuickStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = NexusStore.getTasksForDate(today);
    const habits = NexusStore.getHabits();
    
    // Calculate total planned time
    const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Count meetings (tasks with type "meeting" or containing "meeting" in title)
    const meetings = todayTasks.filter(t => 
      t.title.toLowerCase().includes('meeting') || 
      t.title.toLowerCase().includes('standup') ||
      t.title.toLowerCase().includes('call')
    ).length;
    
    // Update stat cards if they exist
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      const label = card.querySelector('.stat-label')?.textContent;
      const valueEl = card.querySelector('.stat-value');
      
      if (!label || !valueEl) return;
      
      switch (label) {
        case 'Geplante Zeit':
          valueEl.textContent = `${totalHours}h`;
          break;
        case 'Habits':
          valueEl.textContent = habits.length;
          break;
        case 'Meetings':
          valueEl.textContent = meetings;
          break;
      }
    });
  },
  
  // Setup Event Listeners
  setupEventListeners() {
    // Drag & Drop support for task reordering between blocks
    let draggedTaskId = null;
    let draggedFromBlock = null;
    
    document.addEventListener('dragstart', (e) => {
      const taskCard = e.target.closest('[data-task-id]');
      if (taskCard && e.target.closest('#page-command-center')) {
        draggedTaskId = taskCard.dataset.taskId;
        const task = NexusStore.getTaskById(draggedTaskId);
        draggedFromBlock = task?.commandCenterBlock || null;
        taskCard.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        console.log('🎯 Drag started:', draggedTaskId, 'from block:', draggedFromBlock);
      }
    });
    
    document.addEventListener('dragend', (e) => {
      const taskCard = e.target.closest('[data-task-id]');
      if (taskCard) {
        taskCard.style.opacity = '1';
        console.log('🎯 Drag ended');
      }
    });
    
    document.addEventListener('dragover', (e) => {
      if (!draggedTaskId) return;
      
      // Check multiple levels for drop zone
      const blockContainer = e.target.closest('.cc-time-block-tasks') || 
                           e.target.closest('.cc-needs-attention-tasks') ||
                           e.target.closest('.cc-time-block') ||
                           e.target.closest('.cc-needs-attention');
      
      if (blockContainer) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        // Find the actual tasks container
        const tasksContainer = blockContainer.querySelector('.cc-time-block-tasks') || 
                              blockContainer.querySelector('.cc-needs-attention-tasks') ||
                              (blockContainer.classList.contains('cc-time-block-tasks') ? blockContainer : null) ||
                              (blockContainer.classList.contains('cc-needs-attention-tasks') ? blockContainer : null);
        
        if (tasksContainer) {
          tasksContainer.style.background = 'var(--surface-hover)';
          tasksContainer.style.border = '2px dashed var(--primary)';
        }
      }
    });
    
    document.addEventListener('dragleave', (e) => {
      const blockContainer = e.target.closest('.cc-time-block-tasks, .cc-needs-attention-tasks');
      if (blockContainer && (!e.relatedTarget || !blockContainer.contains(e.relatedTarget))) {
        blockContainer.style.background = '';
        blockContainer.style.border = '';
      }
    });
    
    document.addEventListener('drop', (e) => {
      if (!draggedTaskId) return;
      
      console.log('🎯 Drop event fired, target:', e.target.className);
      
      // Try multiple levels to find the drop zone
      const blockContainer = e.target.closest('.cc-time-block-tasks') || 
                           e.target.closest('.cc-needs-attention-tasks') ||
                           e.target.closest('.cc-time-block') ||
                           e.target.closest('.cc-needs-attention');
      
      if (blockContainer) {
        e.preventDefault();
        e.stopPropagation();
        
        // Reset visual feedback
        const tasksContainer = blockContainer.querySelector('.cc-time-block-tasks') || 
                              blockContainer.querySelector('.cc-needs-attention-tasks') ||
                              (blockContainer.classList.contains('cc-time-block-tasks') ? blockContainer : null) ||
                              (blockContainer.classList.contains('cc-needs-attention-tasks') ? blockContainer : null);
        
        if (tasksContainer) {
          tasksContainer.style.background = '';
          tasksContainer.style.border = '';
        }
        
        console.log('🎯 Drop detected on:', blockContainer.className);
        
        // Determine which block this is by checking parent and IDs
        let newBlock = null;
        
        // First try to find by container ID
        if (tasksContainer) {
          const containerId = tasksContainer.id;
          console.log('🎯 Container ID:', containerId);
          
          if (containerId === 'morningTasks') newBlock = 'morning';
          else if (containerId === 'afternoonTasks') newBlock = 'afternoon';
          else if (containerId === 'eveningTasks') newBlock = 'evening';
          else if (containerId === 'needsAttentionTasks') newBlock = null;
        }
        
        // If still not found, check parent structure
        if (newBlock === undefined) {
          const timeBlock = blockContainer.closest('.cc-time-block');
          const needsAttention = blockContainer.closest('.cc-needs-attention');
          
          if (needsAttention) {
            newBlock = null; // Remove from command center
            console.log('🎯 Dropped on needs attention - removing from blocks');
          } else if (timeBlock) {
            // Try to get from sibling heading
            const heading = timeBlock.querySelector('.cc-block-header-title');
            if (heading) {
              const text = heading.textContent.trim();
              console.log('🎯 Block heading text:', text);
              
              if (text.includes('Morgen') || text.includes('Morning')) newBlock = 'morning';
              else if (text.includes('Nachmittag') || text.includes('Afternoon')) newBlock = 'afternoon';
              else if (text.includes('Abend') || text.includes('Evening')) newBlock = 'evening';
            }
          }
        }
        
        console.log('🎯 Determined new block:', newBlock, 'from block:', draggedFromBlock);
        
        // Update task if block changed
        if (newBlock !== draggedFromBlock) {
          const task = NexusStore.getTaskById(draggedTaskId);
          
          NexusStore.updateTask(draggedTaskId, {
            commandCenterBlock: newBlock
          });
          
          NexusUI.showToast({
            type: 'success',
            title: 'Task verschoben',
            message: newBlock 
              ? `"${task.title}" zu ${newBlock === 'morning' ? 'Morgen' : newBlock === 'afternoon' ? 'Nachmittag' : 'Abend'} verschoben`
              : `"${task.title}" aus Zeitblock entfernt`
          });
          
          console.log('✅ Task moved from', draggedFromBlock, 'to', newBlock);
          this.render();
        } else {
          console.log('⏭️ Same block, no change needed');
        }
        
        draggedTaskId = null;
        draggedFromBlock = null;
      } else {
        console.log('❌ No valid drop zone found');
      }
    });
    
    // Delegate event handling for dynamic elements
    document.addEventListener('click', (e) => {
      // Atlas Briefing Action Button
      if (e.target.id === 'cc-briefing-action') {
        this.handleBriefingAction();
        return;
      }
      
      // Quick Action Buttons
      if (e.target.id === 'cc-quick-task') {
        this.handleQuickTask();
        return;
      }
      
      if (e.target.id === 'cc-quick-break') {
        this.handleQuickBreak();
        return;
      }
      
      if (e.target.id === 'cc-quick-reschedule') {
        this.handleQuickReschedule();
        return;
      }
      
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.dataset.action;
      
      switch (action) {
        case 'toggle-task':
          this.handleToggleTask(target);
          break;
        case 'toggle-habit':
          this.handleToggleHabit(target);
          break;
        case 'edit-task':
          this.handleEditTask(target);
          break;
        case 'schedule-task':
          this.handleScheduleTask(target);
          break;
        case 'schedule-today':
          this.handleScheduleToday(target);
          break;
      }
    });
  },
  
  // Handle Atlas Briefing Action
  handleBriefingAction() {
    // TODO: Open Atlas AI to optimize plan
    console.log('Opening Atlas to optimize plan...');
    // Could trigger: NexusUI.showPanel('atlas');
  },
  
  // Handle Quick Task (Add new task)
  handleQuickTask() {
    // TODO: Open quick task creation modal
    console.log('Quick task creation...');
    // Could trigger: NexusUI.showPanel('tasks'); or show quick-add modal
  },
  
  // Handle Quick Break (Schedule 15min break)
  handleQuickBreak() {
    const now = new Date();
    const breakTask = {
      id: Date.now(),
      title: 'Pause',
      spheres: ['wellness'],
      scheduledDate: now.toISOString().split('T')[0],
      scheduledTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      timeEstimate: 15,
      priority: 'low',
      status: 'pending'
    };
    
    NexusStore.saveTask(breakTask);
    this.render();
    
    // Show success feedback
    console.log('15min Pause eingeplant');
  },
  
  // Handle Quick Reschedule (Move overdue to today)
  handleQuickReschedule() {
    const overdueTasks = NexusStore.getOverdueTasks();
    const today = new Date().toISOString().split('T')[0];
    
    overdueTasks.forEach(task => {
      task.scheduledDate = today;
      NexusStore.saveTask(task);
    });
    
    this.render();
    console.log(`${overdueTasks.length} überfällige Tasks auf heute verschoben`);
  },
  
  // Handle toggle task completion
  handleToggleTask(target) {
    const taskCard = target.closest('[data-task-id]');
    if (!taskCard) return;
    
    const taskId = taskCard.dataset.taskId;
    const task = NexusStore.getTaskById(taskId);
    
    if (task) {
      if (task.status === 'completed') {
        NexusStore.updateTask(taskId, { status: 'pending', completedAt: null });
      } else {
        NexusStore.completeTask(taskId);
        NexusUI.showToast({
          type: 'success',
          title: 'Task erledigt!',
          message: task.title
        });
      }
    }
  },
  
  // Handle toggle habit completion
  handleToggleHabit(target) {
    const habitCard = target.closest('[data-habit-id]');
    if (!habitCard) return;
    
    const habitId = habitCard.dataset.habitId;
    const habit = NexusStore.getHabitById(habitId);
    
    if (habit && !NexusStore.isHabitCompletedToday(habitId)) {
      NexusStore.completeHabit(habitId);
      NexusUI.showToast({
        type: 'success',
        title: `${habit.icon} ${habit.name}`,
        message: `Streak: ${habit.streak + 1} Tage!`
      });
    }
  },
  
  // Handle edit task
  handleEditTask(target) {
    const taskCard = target.closest('[data-task-id]');
    if (!taskCard) return;
    
    // TODO: Open edit modal
    console.log('Edit task:', taskCard.dataset.taskId);
  },
  
  // Handle schedule task
  handleScheduleTask(target) {
    const taskCard = target.closest('[data-task-id]');
    if (!taskCard) return;
    
    // TODO: Open schedule picker
    console.log('Schedule task:', taskCard.dataset.taskId);
  },
  
  // Handle schedule for today
  handleScheduleToday(target) {
    const taskEl = target.closest('[data-task-id]');
    if (!taskEl) return;
    
    const taskId = taskEl.dataset.taskId;
    const today = new Date().toISOString().split('T')[0];
    
    NexusStore.updateTask(taskId, { scheduledDate: today });
    
    NexusUI.showToast({
      type: 'success',
      title: 'Task eingeplant',
      message: 'Wurde für heute eingeplant'
    });
  },
  
  // Handle optimize plan button
  handleOptimizePlan() {
    // Open Atlas panel with optimization prompt
    if (typeof AtlasController !== 'undefined') {
      // Open Atlas if not already open
      if (!AtlasController.isOpen) {
        AtlasController.toggle();
      }
      
      // Pre-fill message field with optimization request
      setTimeout(() => {
        const input = document.getElementById('atlas-input');
        if (input) {
          input.value = 'Optimiere meinen heutigen Plan basierend auf meiner Energie und Prioritäten';
          input.focus();
        }
      }, 350);
    }
  },
  
  // Handle briefing later button
  handleBriefingLater() {
    const briefingEl = document.querySelector('.atlas-panel');
    if (briefingEl) {
      briefingEl.style.display = 'none';
      NexusUI.showToast('Briefing geschlossen', 'info');
    }
  },
  
  // Handle show all tasks button
  handleShowAllTasks() {
    if (typeof NexusApp !== 'undefined') {
      // Navigate to tasks page
      NexusApp.navigateTo('tasks');
      
      // Set filter to show overdue + this week
      setTimeout(() => {
        if (typeof TasksModule !== 'undefined') {
          TasksModule.filter = 'pending';
          TasksModule.render();
        }
      }, 100);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if on command center page
  if (document.getElementById('page-command-center')) {
    CommandCenter.init();
  }
});

// Re-initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'command-center') {
    CommandCenter.render();
  }
});

// Export
window.CommandCenter = CommandCenter;
