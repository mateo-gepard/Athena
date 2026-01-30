/* ═══════════════════════════════════════════════════════════════════════════════
   NEXUS ULTRA - Analytics Module
   Productivity insights and statistics
   ═══════════════════════════════════════════════════════════════════════════════ */

const AnalyticsModule = {
  
  period: 'week', // today | week | month | year
  _listenersInitialized: false,
  
  // Initialize
  init() {
    this.render();
  },
  
  // Render
  render() {
    const container = document.getElementById('page-analytics');
    if (!container) return;
    
    const data = this.calculateStats();
    
    container.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-medium">Analytics</h2>
          <p class="text-secondary">Deine Produktivität im Überblick</p>
        </div>
        
        <div class="tabs">
          <button class="tab ${this.period === 'today' ? 'active' : ''}" data-period="today">Heute</button>
          <button class="tab ${this.period === 'week' ? 'active' : ''}" data-period="week">Woche</button>
          <button class="tab ${this.period === 'month' ? 'active' : ''}" data-period="month">Monat</button>
          <button class="tab ${this.period === 'year' ? 'active' : ''}" data-period="year">Jahr</button>
        </div>
      </div>
      
      <!-- Overview Stats -->
      <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(5, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Tasks erledigt</div>
          <div class="stat-value">${data.tasksCompleted}</div>
          <div class="stat-change ${data.tasksChange >= 0 ? 'positive' : 'negative'}">
            ${data.tasksChange >= 0 ? '+' : ''}${data.tasksChange}% vs. Vorperiode
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Habits gehalten</div>
          <div class="stat-value">${data.habitsCompleted}%</div>
          <div class="stat-detail">${data.habitsTotal} Completions</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Produktivster Tag</div>
          <div class="stat-value">${data.bestDay}</div>
          <div class="stat-detail">${data.bestDayTasks} Tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Fokuszeit</div>
          <div class="stat-value">${data.focusHours}h</div>
          <div class="stat-detail">Geschätzt</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Streak</div>
          <div class="stat-value">${data.currentStreak}🔥</div>
          <div class="stat-detail">Aktive Tage</div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid gap-6 mb-6" style="grid-template-columns: 2fr 1fr;">
        <!-- Activity Chart -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Aktivität</span>
          </div>
          <div class="panel-body">
            ${this.renderActivityChart(data.dailyActivity)}
          </div>
        </div>
        
        <!-- Sphere Distribution -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Sphären-Verteilung</span>
          </div>
          <div class="panel-body">
            ${this.renderSphereChart(data.sphereDistribution)}
          </div>
        </div>
      </div>
      
      <!-- Details Row -->
      <div class="grid gap-6" style="grid-template-columns: 1fr 1fr;">
        <!-- Task Stats -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Task-Statistiken</span>
          </div>
          <div class="panel-body">
            ${this.renderTaskStats(data)}
          </div>
        </div>
        
        <!-- Habit Stats -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Habit-Statistiken</span>
          </div>
          <div class="panel-body">
            ${this.renderHabitStats(data)}
          </div>
        </div>
      </div>
      
      <!-- Insights -->
      <div class="atlas-panel mt-6">
        <div class="atlas-header">
          <div class="atlas-icon">🔮</div>
          <span class="atlas-title">Atlas Insights</span>
        </div>
        <div class="atlas-body">
          ${this.generateInsights(data)}
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  // Calculate all stats
  calculateStats() {
    const tasks = NexusStore.getTasks();
    const habits = NexusStore.getHabits();
    const { startDate, endDate, days } = this.getPeriodDates();
    
    // Filter completed tasks in period
    const completedInPeriod = tasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const date = new Date(t.completedAt);
      return date >= startDate && date <= endDate;
    });
    
    // Daily activity
    const dailyActivity = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const tasksOnDay = completedInPeriod.filter(t => 
        t.completedAt && t.completedAt.startsWith(dateStr)
      ).length;
      
      let habitsOnDay = 0;
      habits.forEach(h => {
        if (h.completionLog?.includes(dateStr)) habitsOnDay++;
      });
      
      dailyActivity.push({
        date,
        dateStr,
        label: date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' }),
        tasks: tasksOnDay,
        habits: habitsOnDay
      });
    }
    
    // Find best day
    const bestDayData = dailyActivity.reduce((best, day) => 
      day.tasks > best.tasks ? day : best
    , { tasks: 0, label: '-' });
    
    // Sphere distribution
    const sphereDistribution = {
      geschaeft: 0,
      projekte: 0,
      schule: 0,
      sport: 0,
      freizeit: 0,
      none: 0
    };
    completedInPeriod.forEach(t => {
      if (t.sphere && sphereDistribution.hasOwnProperty(t.sphere)) {
        sphereDistribution[t.sphere]++;
      } else {
        sphereDistribution.none++;
      }
    });
    
    // Habits completion rate
    let habitsTotal = 0;
    let habitsCompletedCount = 0;
    habits.forEach(h => {
      dailyActivity.forEach(d => {
        habitsTotal++;
        if (h.completionLog?.includes(d.dateStr)) habitsCompletedCount++;
      });
    });
    const habitsCompleted = habitsTotal > 0 ? Math.round((habitsCompletedCount / habitsTotal) * 100) : 0;
    
    // Calculate change vs previous period
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);
    const completedPrevPeriod = tasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const date = new Date(t.completedAt);
      return date >= prevStart && date < startDate;
    }).length;
    
    const tasksChange = completedPrevPeriod > 0 
      ? Math.round(((completedInPeriod.length - completedPrevPeriod) / completedPrevPeriod) * 100)
      : 0;
    
    // Priority breakdown
    const byPriority = {
      high: completedInPeriod.filter(t => t.priority === 'high').length,
      medium: completedInPeriod.filter(t => t.priority === 'medium').length,
      low: completedInPeriod.filter(t => t.priority === 'low').length
    };
    
    // Current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hadActivity = tasks.some(t => 
        t.completedAt && t.completedAt.startsWith(dateStr)
      ) || habits.some(h => h.completionLog?.includes(dateStr));
      
      if (hadActivity) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return {
      tasksCompleted: completedInPeriod.length,
      tasksChange,
      habitsCompleted,
      habitsTotal: habitsCompletedCount,
      bestDay: bestDayData.label,
      bestDayTasks: bestDayData.tasks,
      focusHours: Math.round(completedInPeriod.length * 0.5), // Estimate 30min per task
      currentStreak,
      dailyActivity,
      sphereDistribution,
      byPriority,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status !== 'completed').length,
      overdueTasks: tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length,
      topHabits: habits
        .map(h => ({
          ...h,
          completions: h.completionLog?.filter(d => d >= startDate.toISOString().split('T')[0]).length || 0
        }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 5)
    };
  },
  
  // Get period dates
  getPeriodDates() {
    const now = new Date();
    let startDate, endDate, days;
    
    switch (this.period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        days = 1;
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        days = 7;
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        days = 30;
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        days = 365;
        break;
    }
    
    return { startDate, endDate, days };
  },
  
  // Render activity chart (bar chart)
  renderActivityChart(dailyActivity) {
    const maxValue = Math.max(...dailyActivity.map(d => d.tasks + d.habits), 1);
    const showDays = this.period === 'year' ? 12 : dailyActivity.length;
    
    // For year view, aggregate by month
    let chartData = dailyActivity;
    if (this.period === 'year') {
      const byMonth = {};
      dailyActivity.forEach(d => {
        const monthKey = d.date.toLocaleDateString('de-DE', { month: 'short' });
        if (!byMonth[monthKey]) byMonth[monthKey] = { label: monthKey, tasks: 0, habits: 0 };
        byMonth[monthKey].tasks += d.tasks;
        byMonth[monthKey].habits += d.habits;
      });
      chartData = Object.values(byMonth).slice(-12);
    }
    
    return `
      <div class="activity-chart">
        <div class="chart-bars">
          ${chartData.slice(-showDays).map(d => {
            const total = d.tasks + d.habits;
            const height = (total / maxValue) * 100;
            return `
              <div class="chart-bar-group" title="${d.label}: ${d.tasks} Tasks, ${d.habits} Habits">
                <div class="chart-bar" style="height: ${height}%;">
                  <div class="bar-tasks" style="height: ${(d.tasks / Math.max(total, 1)) * 100}%"></div>
                  <div class="bar-habits" style="height: ${(d.habits / Math.max(total, 1)) * 100}%"></div>
                </div>
                <div class="chart-label">${d.label}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="chart-legend">
          <span><span class="legend-dot tasks"></span> Tasks</span>
          <span><span class="legend-dot habits"></span> Habits</span>
        </div>
      </div>
    `;
  },
  
  // Render sphere distribution
  renderSphereChart(distribution) {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return `<div class="text-center text-tertiary py-8">Keine Daten</div>`;
    }
    
    const spheres = [
      { key: 'geschaeft', label: 'Geschäft', icon: '💼' },
      { key: 'projekte', label: 'Projekte', icon: '🚀' },
      { key: 'schule', label: 'Schule', icon: '📚' },
      { key: 'sport', label: 'Sport', icon: '💪' },
      { key: 'freizeit', label: 'Freizeit', icon: '🎮' },
      { key: 'none', label: 'Keine', icon: '○' }
    ];
    
    return `
      <div class="sphere-distribution">
        ${spheres.map(s => {
          const value = distribution[s.key] || 0;
          const percent = Math.round((value / total) * 100);
          return `
            <div class="sphere-row">
              <span class="sphere-icon">${s.icon}</span>
              <span class="sphere-label">${s.label}</span>
              <div class="sphere-bar">
                <div class="sphere-fill" 
                     style="width: ${percent}%; background: var(--color-sphere-${s.key}, var(--color-border))">
                </div>
              </div>
              <span class="sphere-value">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  // Render task stats
  renderTaskStats(data) {
    return `
      <div class="stats-grid">
        <div class="stat-row">
          <span>Gesamt Tasks</span>
          <span class="font-medium">${data.totalTasks}</span>
        </div>
        <div class="stat-row">
          <span>Ausstehend</span>
          <span class="font-medium">${data.pendingTasks}</span>
        </div>
        <div class="stat-row">
          <span>Überfällig</span>
          <span class="font-medium text-danger">${data.overdueTasks}</span>
        </div>
        <div class="divider my-3"></div>
        <div class="stat-row">
          <span>🔴 Hohe Priorität</span>
          <span class="font-medium">${data.byPriority.high}</span>
        </div>
        <div class="stat-row">
          <span>🟡 Mittlere Priorität</span>
          <span class="font-medium">${data.byPriority.medium}</span>
        </div>
        <div class="stat-row">
          <span>🟢 Niedrige Priorität</span>
          <span class="font-medium">${data.byPriority.low}</span>
        </div>
      </div>
    `;
  },
  
  // Render habit stats
  renderHabitStats(data) {
    if (data.topHabits.length === 0) {
      return `<div class="text-center text-tertiary py-4">Keine Habits definiert</div>`;
    }
    
    return `
      <div class="stats-grid">
        <div class="text-xs text-tertiary mb-2">Top Habits diese Periode:</div>
        ${data.topHabits.map((h, i) => `
          <div class="stat-row">
            <span>
              <span class="text-tertiary">#${i + 1}</span>
              ${h.icon || '🔄'} ${h.name}
            </span>
            <span class="font-medium">${h.completions}x</span>
          </div>
        `).join('')}
        <div class="divider my-3"></div>
        <div class="stat-row">
          <span>Längster Streak</span>
          <span class="font-medium text-warning">
            ${Math.max(...data.topHabits.map(h => h.streak || 0))}🔥
          </span>
        </div>
      </div>
    `;
  },
  
  // Generate AI-style insights
  generateInsights(data) {
    const insights = [];
    
    // Task completion insight
    if (data.tasksCompleted > 10) {
      insights.push(`🚀 Starke Woche! Du hast ${data.tasksCompleted} Tasks abgeschlossen.`);
    } else if (data.tasksCompleted > 0) {
      insights.push(`✓ Du hast ${data.tasksCompleted} Tasks in dieser Periode erledigt.`);
    }
    
    // Habit insight
    if (data.habitsCompleted >= 80) {
      insights.push(`💪 Ausgezeichnete Habit-Konsistenz mit ${data.habitsCompleted}%!`);
    } else if (data.habitsCompleted >= 50) {
      insights.push(`🔄 Deine Habit-Rate liegt bei ${data.habitsCompleted}%. Weiter so!`);
    } else if (data.habitsCompleted > 0) {
      insights.push(`⚡ Tipp: Fokussiere dich auf 2-3 Kernhabits, um deine Rate zu verbessern.`);
    }
    
    // Overdue insight
    if (data.overdueTasks > 5) {
      insights.push(`⚠️ ${data.overdueTasks} überfällige Tasks. Zeit aufzuräumen!`);
    } else if (data.overdueTasks > 0) {
      insights.push(`📋 ${data.overdueTasks} Task(s) überfällig - priorisiere sie heute.`);
    }
    
    // Best day insight
    if (data.bestDayTasks > 0) {
      insights.push(`📈 Dein produktivster Tag war ${data.bestDay} mit ${data.bestDayTasks} Tasks.`);
    }
    
    // Streak insight
    if (data.currentStreak >= 7) {
      insights.push(`🔥 Beeindruckender ${data.currentStreak}-Tage-Streak! Bleib dran!`);
    }
    
    // Sphere balance
    const sphereValues = Object.values(data.sphereDistribution);
    const maxSphere = Math.max(...sphereValues);
    const minSphere = Math.min(...sphereValues.filter(v => v > 0));
    if (maxSphere > minSphere * 3 && minSphere > 0) {
      insights.push(`⚖️ Deine Sphären sind unausgeglichen. Versuche, alle Bereiche zu berücksichtigen.`);
    }
    
    if (insights.length === 0) {
      insights.push(`📊 Sammle mehr Daten für personalisierte Insights!`);
    }
    
    return insights.join('<br><br>');
  },
  
  // Setup event listeners
  setupEventListeners() {
    if (this._listenersInitialized) return;
    this._listenersInitialized = true;
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#page-analytics')) return;
      
      const periodTab = e.target.closest('[data-period]');
      if (periodTab) {
        this.period = periodTab.dataset.period;
        this.render();
      }
    });
  }
};

// Initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'analytics') {
    AnalyticsModule.init();
  }
});

// Export
window.AnalyticsModule = AnalyticsModule;
