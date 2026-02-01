
/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Analytics Module
   Modern Performance Analytics & Insights Dashboard
   ═══════════════════════════════════════════════════════════════════════════════ */

const Analytics = {
  
  currentPeriod: 7, // Default: 7 days
  
  // Initialize Analytics
  init() {
    this.render();
    this.setupEventListeners();
    
    // Subscribe to store changes
    NexusStore.subscribe((action) => {
      if (action.startsWith('task:') || action.startsWith('habit:')) {
        this.render();
      }
    });
  },
  
  // Setup Event Listeners
  setupEventListeners() {
    // Period selection
    document.querySelectorAll('.analytics-period .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = parseInt(e.target.dataset.period);
        this.changePeriod(period);
      });
    });
    
    // Quick Actions
    const optimizeBtn = document.getElementById('optimize-schedule-btn');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.handleOptimizeSchedule());
    }
    
    const exportBtn = document.getElementById('export-analytics-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportData());
    }
    
    const resetBtn = document.getElementById('reset-analytics-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetAnalytics());
    }
  },
  
  // Change Period
  changePeriod(days) {
    this.currentPeriod = days;
    
    // Update active button
    document.querySelectorAll('.analytics-period .btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.period) === days);
    });
    
    this.render();
  },
  
  // Render all sections
  render() {
    this.renderKeyStats();
    this.renderWeeklyHeatmap();
    this.renderSphereBalance();
    this.renderCompletionTrend();
    this.renderBurnoutRisk();
    this.renderNeglectedWork();
    NexusUI.refreshIcons();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // KEY STATS (Top Row)
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderKeyStats() {
    const metrics = this.calculateMetrics();
    
    // Task Completion
    const taskCompletionEl = document.getElementById('stat-task-completion');
    if (taskCompletionEl) {
      taskCompletionEl.textContent = `${metrics.taskCompletionRate}%`;
      taskCompletionEl.className = `stat-value ${this.getCompletionClass(metrics.taskCompletionRate)}`;
    }
    
    const taskDetailEl = document.getElementById('stat-task-detail');
    if (taskDetailEl) {
      taskDetailEl.textContent = `${metrics.tasksCompleted}/${metrics.tasksScheduled} Tasks`;
    }
    
    const taskTrendEl = document.getElementById('stat-task-trend');
    if (taskTrendEl) {
      const trend = metrics.taskTrend;
      taskTrendEl.className = `stat-trend ${trend >= 0 ? 'positive' : 'negative'}`;
      taskTrendEl.innerHTML = `
        <i data-lucide="${trend >= 0 ? 'trending-up' : 'trending-down'}"></i>
        <span>${trend >= 0 ? '+' : ''}${trend}%</span>
      `;
    }
    
    // Habit Consistency
    const habitConsistencyEl = document.getElementById('stat-habit-consistency');
    if (habitConsistencyEl) {
      habitConsistencyEl.textContent = `${metrics.habitConsistency}%`;
      habitConsistencyEl.className = `stat-value ${this.getCompletionClass(metrics.habitConsistency)}`;
    }
    
    const habitDetailEl = document.getElementById('stat-habit-detail');
    if (habitDetailEl) {
      habitDetailEl.textContent = `${metrics.habitCompletionDays}/${this.currentPeriod} Tage`;
    }
    
    const habitTrendEl = document.getElementById('stat-habit-trend');
    if (habitTrendEl) {
      const trend = metrics.habitTrend;
      habitTrendEl.className = `stat-trend ${trend >= 0 ? 'positive' : 'negative'}`;
      habitTrendEl.innerHTML = `
        <i data-lucide="${trend >= 0 ? 'trending-up' : 'trending-down'}"></i>
        <span>${trend >= 0 ? '+' : ''}${trend}%</span>
      `;
    }
    
    // Average Time
    const avgTimeEl = document.getElementById('stat-avg-time');
    if (avgTimeEl) {
      avgTimeEl.textContent = `${metrics.avgDailyHours.toFixed(1)}h`;
    }
    
    const timeDetailEl = document.getElementById('stat-time-detail');
    if (timeDetailEl) {
      timeDetailEl.textContent = `Ø ${metrics.avgDailyTasks} Tasks/Tag`;
    }
    
    const timeTrendEl = document.getElementById('stat-time-trend');
    if (timeTrendEl) {
      const trend = metrics.timeTrend;
      timeTrendEl.className = `stat-trend ${trend >= 0 ? 'negative' : 'positive'}`; // More time = negative
      timeTrendEl.innerHTML = `
        <i data-lucide="${trend >= 0 ? 'trending-up' : 'trending-down'}"></i>
        <span>${trend >= 0 ? '+' : ''}${trend}%</span>
      `;
    }
    
    // Streak
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) {
      streakEl.textContent = metrics.currentStreak;
    }
    
    const streakBestEl = document.getElementById('stat-streak-best');
    if (streakBestEl) {
      streakBestEl.innerHTML = `
        <i data-lucide="award"></i>
        <span>Best: ${metrics.bestStreak}</span>
      `;
    }
    
    NexusUI.refreshIcons();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WEEKLY HEATMAP
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderWeeklyHeatmap() {
    const container = document.getElementById('weeklyHeatmap');
    if (!container) return;
    
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    let html = '';
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0 };
      
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      const completion = dayData.tasksScheduled > 0 
        ? (dayData.tasksCompleted / dayData.tasksScheduled) 
        : 0;
      
      const level = completion >= 0.8 ? 'high' : 
                    completion >= 0.5 ? 'medium' : 
                    completion > 0 ? 'low' : 'none';
      
      html += `
        <div class="heatmap-day ${level}" 
             title="${dayName} ${date.getDate()}.${date.getMonth() + 1}: ${Math.round(completion * 100)}% completed">
          <div class="heatmap-label">${dayName}</div>
          <div class="heatmap-count">${dayData.tasksCompleted}/${dayData.tasksScheduled}</div>
        </div>
      `;
    }
    
    container.innerHTML = html;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPHERE BALANCE CHART
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderSphereBalance() {
    const container = document.getElementById('sphereBalanceChart');
    if (!container) return;
    
    const balance = this.calculateSphereBalance();
    const donut = document.getElementById('sphereDonut');
    const legend = document.getElementById('sphereLegend');
    
    if (!donut || !legend) return;
    
    // Build donut chart with CSS conic-gradient
    const totalHours = balance.spheres.reduce((sum, s) => sum + s.hours, 0);
    
    if (totalHours === 0) {
      donut.style.background = 'var(--surface-2)';
      donut.setAttribute('data-total-hours', '0h');
      legend.innerHTML = '<div class="text-tertiary">Noch keine Daten vorhanden</div>';
      return;
    }
    
    let currentDeg = 0;
    const gradientParts = [];
    
    balance.spheres.forEach((sphere, index) => {
      const percentage = (sphere.hours / totalHours) * 100;
      const deg = (percentage / 100) * 360;
      
      donut.style.setProperty(`--sphere-${index + 1}-color`, sphere.color);
      donut.style.setProperty(`--sphere-${index + 1}-deg`, `${currentDeg + deg}deg`);
      
      gradientParts.push(`${sphere.color} ${currentDeg}deg ${currentDeg + deg}deg`);
      currentDeg += deg;
    });
    
    donut.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    donut.setAttribute('data-total-hours', `${totalHours.toFixed(0)}h`);
    
    // Build legend
    legend.innerHTML = balance.spheres.map(sphere => `
      <div class="sphere-legend-item">
        <div class="sphere-legend-color" style="background: ${sphere.color}"></div>
        <div class="sphere-legend-content">
          <div class="sphere-legend-label">${sphere.icon} ${sphere.name}</div>
          <div>
            <span class="sphere-legend-value">${sphere.hours.toFixed(1)}h</span>
            <span class="sphere-legend-percentage">(${sphere.percentage}%)</span>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLETION TREND
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderCompletionTrend() {
    const container = document.getElementById('completionTrend');
    if (!container) return;
    
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    let html = '';
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0 };
      
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      const completion = dayData.tasksScheduled > 0 
        ? Math.round((dayData.tasksCompleted / dayData.tasksScheduled) * 100) 
        : 0;
      
      html += `
        <div class="trend-bar-item">
          <div class="trend-bar-label">${dayName}</div>
          <div class="trend-bar-container">
            <div class="trend-bar-fill" style="width: ${completion}%">
              <span class="trend-bar-value">${completion}%</span>
            </div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BURNOUT RISK
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderBurnoutRisk() {
    const container = document.getElementById('burnoutRisk');
    const card = document.getElementById('burnoutRiskCard');
    if (!container || !card) return;
    
    const risk = this.calculateBurnoutRisk();
    
    // Update card border color based on risk level
    card.style.borderLeft = risk.level === 'high' ? '3px solid #ef4444' :
                            risk.level === 'medium' ? '3px solid #fbbf24' :
                            '3px solid #22c55e';
    
    container.innerHTML = `
      <div class="burnout-score-display ${risk.level}">
        <div class="burnout-score-circle">
          <div>${risk.score}</div>
          <div class="burnout-score-label">RISK</div>
        </div>
        <div class="burnout-score-info">
          <div class="burnout-score-title">${risk.label}</div>
          <div class="burnout-score-message">${risk.message}</div>
        </div>
      </div>
      
      <div class="burnout-factors">
        ${risk.factors.map(factor => `
          <div class="burnout-factor ${factor.severity}">
            <div class="burnout-factor-icon">
              <i data-lucide="${factor.icon}"></i>
            </div>
            <div class="burnout-factor-content">
              <div class="burnout-factor-label">${factor.title}</div>
              <div class="burnout-factor-value">${factor.value}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${risk.recommendations.length > 0 ? `
        <div class="burnout-recommendations">
          <div class="burnout-recommendations-title">
            <i data-lucide="lightbulb"></i>
            Empfehlungen
          </div>
          ${risk.recommendations.slice(0, 3).map(rec => `
            <div class="burnout-recommendation">${rec}</div>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEGLECTED WORK
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderNeglectedWork() {
    const container = document.getElementById('neglectedWork');
    if (!container) return;
    
    const neglected = this.getNeglectedWork();
    const total = neglected.tasks.length + neglected.projects.length + neglected.ventures.length;
    
    if (total === 0) {
      container.innerHTML = `
        <div class="neglected-empty">
          <i data-lucide="party-popper"></i>
          <div>Keine vernachlässigte Arbeit!</div>
          <div style="font-size: 13px; margin-top: 8px;">Du hast alles im Griff 🎉</div>
        </div>
      `;
      NexusUI.refreshIcons();
      return;
    }
    
    const allItems = [
      ...neglected.tasks.map(t => ({ type: 'task', data: t, days: t.daysSinceUpdate, icon: 'list-todo' })),
      ...neglected.projects.map(p => ({ type: 'project', data: p, days: p.daysSinceUpdate, icon: 'folder' })),
      ...neglected.ventures.map(v => ({ type: 'venture', data: v, days: v.daysSinceUpdate, icon: 'rocket' }))
    ].sort((a, b) => b.days - a.days).slice(0, 5);
    
    container.innerHTML = `
      <div class="neglected-work-list">
        ${allItems.map(item => `
          <div class="neglected-item" data-type="${item.type}" data-id="${item.data.id}">
            <div class="neglected-item-icon">
              <i data-lucide="${item.icon}"></i>
            </div>
            <div class="neglected-item-content">
              <div class="neglected-item-title">${item.data.name || item.data.title}</div>
              <div class="neglected-item-detail">
                ${item.type === 'task' ? `Priority: ${item.data.priority}` : 
                  item.type === 'project' ? `Status: ${item.data.status}` :
                  `Status: ${item.data.status}`}
              </div>
            </div>
            <div class="neglected-item-days">${item.days}d</div>
          </div>
        `).join('')}
      </div>
      ${total > 5 ? `
        <div style="text-align: center; margin-top: 12px; color: var(--text-tertiary); font-size: 13px;">
          +${total - 5} weitere...
        </div>
      ` : ''}
    `;
    
    NexusUI.refreshIcons();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  calculateMetrics() {
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const period = this.currentPeriod;
    
    const currentPeriodData = [];
    const prevPeriodData = [];
    
    // Current period
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      currentPeriodData.push(history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0, plannedMinutes: 0, habitCompletions: 0, totalHabits: 0 });
    }
    
    // Previous period (for trend comparison)
    for (let i = (period * 2) - 1; i >= period; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      prevPeriodData.push(history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0, plannedMinutes: 0 });
    }
    
    // Task metrics
    const tasksCompleted = currentPeriodData.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const tasksScheduled = currentPeriodData.reduce((sum, d) => sum + d.tasksScheduled, 0);
    const taskCompletionRate = tasksScheduled > 0 ? Math.round((tasksCompleted / tasksScheduled) * 100) : 0;
    
    const prevTasksCompleted = prevPeriodData.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const prevTasksScheduled = prevPeriodData.reduce((sum, d) => sum + d.tasksScheduled, 0);
    const prevCompletionRate = prevTasksScheduled > 0 ? (prevTasksCompleted / prevTasksScheduled) * 100 : 0;
    const taskTrend = Math.round(taskCompletionRate - prevCompletionRate);
    
    // Habit metrics
    const habitCompletionDays = currentPeriodData.filter(d => 
      d.totalHabits > 0 && d.habitCompletions === d.totalHabits
    ).length;
    const habitConsistency = Math.round((habitCompletionDays / period) * 100);
    
    const prevHabitCompletionDays = prevPeriodData.filter(d =>
      d.totalHabits > 0 && d.habitCompletions === d.totalHabits
    ).length;
    const prevHabitConsistency = (prevHabitCompletionDays / period) * 100;
    const habitTrend = Math.round(habitConsistency - prevHabitConsistency);
    
    // Time metrics
    const totalMinutes = currentPeriodData.reduce((sum, d) => sum + (d.plannedMinutes || 0), 0);
    const avgDailyHours = totalMinutes / 60 / period;
    const avgDailyTasks = Math.round(tasksScheduled / period);
    
    const prevTotalMinutes = prevPeriodData.reduce((sum, d) => sum + (d.plannedMinutes || 0), 0);
    const prevAvgDailyHours = prevTotalMinutes / 60 / period;
    const timeTrend = prevAvgDailyHours > 0 
      ? Math.round(((avgDailyHours - prevAvgDailyHours) / prevAvgDailyHours) * 100) 
      : 0;
    
    // Streak (days with >80% completion)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = currentPeriodData.length - 1; i >= 0; i--) {
      const day = currentPeriodData[i];
      const completion = day.tasksScheduled > 0 ? (day.tasksCompleted / day.tasksScheduled) : 0;
      
      if (completion >= 0.8) {
        tempStreak++;
        if (i === currentPeriodData.length - 1) currentStreak = tempStreak;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      taskCompletionRate,
      tasksCompleted,
      tasksScheduled,
      taskTrend,
      habitConsistency,
      habitCompletionDays,
      habitTrend,
      avgDailyHours,
      avgDailyTasks,
      timeTrend,
      currentStreak,
      bestStreak
    };
  },
  
  calculateSphereBalance() {
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const period = this.currentPeriod;
    
    const sphereMinutes = {};
    
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = history[dateStr] || { sphereMinutes: {} };
      
      Object.entries(dayData.sphereMinutes || {}).forEach(([sphere, minutes]) => {
        sphereMinutes[sphere] = (sphereMinutes[sphere] || 0) + minutes;
      });
    }
    
    const totalMinutes = Object.values(sphereMinutes).reduce((sum, m) => sum + m, 0);
    
    const spheres = Object.entries(sphereMinutes).map(([name, minutes]) => {
      const hours = minutes / 60;
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      const color = NexusUI.getSphereColor(name);
      const icon = NexusUI.getSphereIcon(name);
      
      return { name, hours, percentage, color, icon };
    }).sort((a, b) => b.hours - a.hours);
    
    return { spheres };
  },
  
  calculateBurnoutRisk() {
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(history[dateStr] || { overdueTasks: 0, plannedMinutes: 0, sphereMinutes: {} });
    }
    
    const currentOverdue = NexusStore.getOverdueTasks().length;
    const totalPlannedMinutes = last7Days.reduce((sum, d) => sum + (d.plannedMinutes || 0), 0);
    const avgPlannedHours = totalPlannedMinutes / (7 * 60);
    
    let recreationMinutes = 0;
    last7Days.forEach(day => {
      if (day.sphereMinutes && day.sphereMinutes.freizeit) {
        recreationMinutes += day.sphereMinutes.freizeit;
      }
    });
    const avgRecreationHours = recreationMinutes / 60 / 7;
    
    const metrics = this.calculateMetrics();
    
    // Check if there's any actual data
    const hasData = totalPlannedMinutes > 0 || currentOverdue > 0 || recreationMinutes > 0;
    
    if (!hasData) {
      // No data yet - show healthy state
      return {
        score: 0,
        level: 'low',
        label: 'GESUND',
        message: 'Keine Daten vorhanden',
        factors: [
          { title: 'Überfällig', value: 0, severity: 'low', icon: 'alert-triangle' },
          { title: 'Ø Arbeitslast', value: '0h', severity: 'low', icon: 'clock' },
          { title: 'Erholung', value: '0h', severity: 'low', icon: 'coffee' },
          { title: 'Completion', value: '0%', severity: 'low', icon: 'check-circle' }
        ],
        recommendations: ['Beginne Tasks zu planen', 'Tracke deine Zeit']
      };
    }
    
    let riskScore = 0;
    const factors = [];
    
    // Overdue tasks (max 30 points)
    const overdueRisk = Math.min(30, currentOverdue * 5);
    riskScore += overdueRisk;
    factors.push({
      title: 'Überfällig',
      value: currentOverdue,
      severity: currentOverdue > 5 ? 'high' : currentOverdue > 2 ? 'medium' : 'low',
      icon: 'alert-triangle'
    });
    
    // Daily load (max 30 points)
    const loadRisk = avgPlannedHours > 10 ? 30 : avgPlannedHours > 8 ? 20 : avgPlannedHours > 6 ? 10 : 0;
    riskScore += loadRisk;
    factors.push({
      title: 'Ø Arbeitslast',
      value: `${avgPlannedHours.toFixed(1)}h`,
      severity: avgPlannedHours > 10 ? 'high' : avgPlannedHours > 8 ? 'medium' : 'low',
      icon: 'clock'
    });
    
    // Recreation (max 20 points - inverse) - only penalize if there's work planned
    const recreationRisk = totalPlannedMinutes > 0 ? (avgRecreationHours < 0.5 ? 20 : avgRecreationHours < 1 ? 10 : 0) : 0;
    riskScore += recreationRisk;
    factors.push({
      title: 'Erholung',
      value: `${avgRecreationHours.toFixed(1)}h`,
      severity: avgRecreationHours < 0.5 && totalPlannedMinutes > 0 ? 'high' : avgRecreationHours < 1 && totalPlannedMinutes > 0 ? 'medium' : 'low',
      icon: 'coffee'
    });
    
    // Completion rate (max 20 points - inverse)
    const completionRisk = metrics.taskCompletionRate < 50 ? 20 : metrics.taskCompletionRate < 70 ? 10 : 0;
    riskScore += completionRisk;
    factors.push({
      title: 'Completion',
      value: `${metrics.taskCompletionRate}%`,
      severity: metrics.taskCompletionRate < 50 ? 'high' : metrics.taskCompletionRate < 70 ? 'medium' : 'low',
      icon: 'check-circle'
    });
    
    let level, label, message, recommendations;
    
    if (riskScore >= 70) {
      level = 'high';
      label = 'KRITISCH';
      message = 'Massiv überlastet! Sofortige Maßnahmen erforderlich.';
      recommendations = [
        'Streiche nicht-kritische Tasks',
        'Blockiere 2h täglich für Erholung',
        'Delegiere wenn möglich'
      ];
    } else if (riskScore >= 40) {
      level = 'medium';
      label = 'ERHÖHT';
      message = 'Workload sollte reduziert werden.';
      recommendations = [
        'Reduziere Planned Time um 20%',
        'Priorisiere nur kritische Tasks',
        'Plane bewusst Pausen ein'
      ];
    } else {
      level = 'low';
      label = 'GESUND';
      message = 'Workload ist unter Kontrolle!';
      recommendations = [
        'Tempo beibehalten',
        'Work-Life-Balance achten'
      ];
    }
    
    return { score: riskScore, level, label, message, factors, recommendations };
  },
  
  getNeglectedWork() {
    // Get forgotten tasks (>7 days)
    const tasks = NexusStore.getForgottenTasks ? NexusStore.getForgottenTasks() : [];
    
    // Get stale projects (>14 days)
    const projects = NexusStore.getStaleProjects ? NexusStore.getStaleProjects() : [];
    
    // Get stale ventures (>14 days)
    const ventures = NexusStore.getStaleVentures ? NexusStore.getStaleVentures() : [];
    
    return { tasks, projects, ventures };
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getCompletionClass(percentage) {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return '';
    return 'text-danger';
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  handleOptimizeSchedule() {
    if (typeof AtlasController !== 'undefined') {
      if (!AtlasController.isOpen) {
        AtlasController.toggle();
      }
      setTimeout(() => {
        const input = document.getElementById('atlas-input');
        if (input) {
          input.value = 'Optimiere meinen Schedule basierend auf Analytics-Daten';
          input.focus();
        }
      }, 350);
    }
  },
  
  handleExportData() {
    const history = NexusStore.getAnalyticsHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athena-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    NexusUI.showToast({ type: 'success', title: 'Export erfolgreich', message: 'Analytics-Daten heruntergeladen' });
  },
  
  handleResetAnalytics() {
    if (confirm('Wirklich alle Analytics-Daten zurücksetzen? Dies kann nicht rückgängig gemacht werden!')) {
      localStorage.removeItem('athena_analytics_history');
      this.render();
      NexusUI.showToast({ type: 'info', title: 'Zurückgesetzt', message: 'Analytics-Daten wurden gelöscht' });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-analytics')) {
    Analytics.init();
  }
});

// Re-initialize on navigation
window.addEventListener('nexus:navigate', (e) => {
  if (e.detail.page === 'analytics') {
    Analytics.render();
  }
});

// Export
window.Analytics = Analytics;
