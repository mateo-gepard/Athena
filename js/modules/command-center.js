/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Command Center Module
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
    this.renderMorningBriefing();
    this.renderTimeBlocks();
    this.renderTaskPool();
    this.renderHabits();
    this.renderQuickStats();
    NexusUI.refreshIcons();
  },
  
  // Render Atlas Morning Briefing
  renderMorningBriefing() {
    const briefingEl = document.getElementById('atlasBriefing');
    if (!briefingEl) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = NexusStore.getTasksForDate(today);
    const overdueTasks = NexusStore.getOverdueTasks();
    const habits = NexusStore.getHabits();
    const completedHabits = habits.filter(h => NexusStore.isHabitCompletedToday(h.id));
    
    // Calculate total planned time
    const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Find highest streak habit
    const highestStreak = habits.reduce((max, h) => h.streak > max.streak ? h : max, { streak: 0 });
    
    // Build briefing content
    let briefing = '🌅 Guten Morgen! Hier ist dein Tag:<br><br>';
    
    briefing += `Du hast <strong>${todayTasks.length} Tasks</strong> geplant (ca. ${totalHours}h). `;
    briefing += `${habits.length - completedHabits.length} Habits sind noch fällig.<br><br>`;
    
    if (overdueTasks.length > 0) {
      briefing += `⚠️ <strong>${overdueTasks.length} überfällige Tasks</strong> brauchen deine Aufmerksamkeit.<br><br>`;
    }
    
    if (highestStreak.streak > 30) {
      briefing += `💡 Dein ${highestStreak.name}-Streak ist bei ${highestStreak.streak} Tagen! Weiter so! 🔥<br><br>`;
    }
    
    // Find critical tasks
    const criticalTasks = todayTasks.filter(t => t.priority === 'critical');
    if (criticalTasks.length > 0) {
      briefing += `🔴 <strong>${criticalTasks.length} kritische Tasks</strong> heute: `;
      briefing += criticalTasks.map(t => `"${t.title}"`).join(', ');
    }
    
    briefingEl.innerHTML = briefing;
  },
  
  // Render Time Blocks (Morning, Afternoon, Evening)
  renderTimeBlocks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = NexusStore.getTasksForDate(today);
    
    // Sort tasks by scheduled time
    tasks.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
    
    // Categorize by time block
    const blocks = {
      morning: [],    // 06:00 - 12:00
      afternoon: [],  // 12:00 - 18:00
      evening: []     // 18:00 - 22:00
    };
    
    tasks.forEach(task => {
      if (!task.scheduledTime) {
        blocks.morning.push(task); // Default to morning
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
    this.renderBlock('morningTasks', blocks.morning);
    this.renderBlock('afternoonTasks', blocks.afternoon);
    this.renderBlock('eveningTasks', blocks.evening);
  },
  
  // Render a single time block
  renderBlock(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="text-tertiary text-center p-4">
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
        return NexusUI.renderTaskCard(item.data);
      } else {
        return this.renderHabitInTimeline(item.data);
      }
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
            <span>Streak: ${habit.streak} ${habit.streak > 0 ? '🔥' : ''}</span>
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
    
    if (overdueContainer) {
      if (overdueTasks.length === 0) {
        overdueContainer.innerHTML = '<div class="text-tertiary">Keine überfälligen Tasks 🎉</div>';
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
    // Delegate event handling for dynamic elements
    document.addEventListener('click', (e) => {
      // Briefing buttons
      if (e.target.id === 'optimize-plan-btn') {
        this.handleOptimizePlan();
        return;
      }
      
      if (e.target.id === 'briefing-later-btn') {
        this.handleBriefingLater();
        return;
      }
      
      // Task Pool 'Alle' button
      if (e.target.id === 'show-all-tasks-btn') {
        this.handleShowAllTasks();
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
          title: 'Task erledigt! ✓',
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
        message: `Streak: ${habit.streak + 1} Tage! 🔥`
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
    if (typeof NexusApp !== 'undefined') {
      // Open Atlas if not already open
      if (!NexusApp.isAtlasOpen) {
        NexusApp.toggleAtlas();
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
    const briefingEl = document.querySelector('.atlas-briefing');
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
