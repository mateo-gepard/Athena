/* ═══════════════════════════════════════════════════════════════════════════════
   Athena Ultra - Analytics Module
   Produktivitäts-Tracking & Insights
   ═══════════════════════════════════════════════════════════════════════════════ */

const Analytics = {
  
  // Initialize Analytics
  init() {
    this.render();
    
    // Subscribe to store changes
    NexusStore.subscribe((action) => {
      if (action.startsWith('task:') || action.startsWith('habit:')) {
        this.render();
      }
    });
  },
  
  // Render all sections
  render() {
    this.renderCompletionMetrics();
    this.renderBurnoutRisk();
    this.renderSphereBalance();
    this.renderNeglectedWork();
    NexusUI.refreshIcons();
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. COMPLETION METRICS DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderCompletionMetrics() {
    const container = document.getElementById('completionMetrics');
    if (!container) return;
    
    const metrics = this.calculateCompletionMetrics();
    
    container.innerHTML = `
      <div class="analytics-section">
        <div class="section-header">
          <h2><i data-lucide="trending-up"></i> Completion Metrics</h2>
          <p class="text-tertiary">Deine Produktivitäts-Performance</p>
        </div>
        
        <div class="metrics-grid">
          <!-- Daily Task Completion Rate -->
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Task Completion Rate (7 Tage)</span>
              <span class="metric-value ${this.getCompletionClass(metrics.taskCompletionRate)}">${metrics.taskCompletionRate}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${metrics.taskCompletionRate}%; background: ${this.getCompletionColor(metrics.taskCompletionRate)}"></div>
            </div>
            <div class="metric-detail">
              ${metrics.tasksCompletedWeek} / ${metrics.tasksScheduledWeek} Tasks erledigt
            </div>
          </div>
          
          <!-- Habit Consistency Score -->
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Habit Consistency (7 Tage)</span>
              <span class="metric-value ${this.getCompletionClass(metrics.habitConsistency)}">${metrics.habitConsistency}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${metrics.habitConsistency}%; background: ${this.getCompletionColor(metrics.habitConsistency)}"></div>
            </div>
            <div class="metric-detail">
              ${metrics.habitCompletionDays} / 7 Tage alle Habits completed
            </div>
          </div>
          
          <!-- Weekly Trend -->
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Trend (vs. Vorwoche)</span>
              <span class="metric-value ${metrics.trend >= 0 ? 'text-success' : 'text-danger'}">
                ${metrics.trend >= 0 ? '+' : ''}${metrics.trend}%
              </span>
            </div>
            <div class="trend-indicator">
              <i data-lucide="${metrics.trend >= 0 ? 'trending-up' : 'trending-down'}"></i>
              ${metrics.trend >= 0 ? 'Aufwärtstrend' : 'Abwärtstrend'}
            </div>
          </div>
          
          <!-- Current Streak -->
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Productivity Streak</span>
              <span class="metric-value">${metrics.productivityStreak} Tage</span>
            </div>
            <div class="metric-detail">
              <i data-lucide="flame"></i> Tage mit >80% Task Completion
            </div>
          </div>
        </div>
        
        <!-- Weekly Heatmap -->
        <div class="heatmap-section">
          <h3>Last 7 Days Heatmap</h3>
          <div class="heatmap-grid">
            ${this.renderWeeklyHeatmap(metrics.dailyData)}
          </div>
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  calculateCompletionMetrics() {
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const last7Days = [];
    const last14Days = [];
    
    // Get last 7 days data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0, habitCompletions: 0, totalHabits: 0 });
    }
    
    // Get last 14 days for trend comparison
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last14Days.push(history[dateStr] || { tasksCompleted: 0, tasksScheduled: 0 });
    }
    
    // Calculate task completion rate (last 7 days)
    const tasksCompletedWeek = last7Days.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const tasksScheduledWeek = last7Days.reduce((sum, d) => sum + d.tasksScheduled, 0);
    const taskCompletionRate = tasksScheduledWeek > 0 
      ? Math.round((tasksCompletedWeek / tasksScheduledWeek) * 100) 
      : 0;
    
    // Calculate habit consistency (days with all habits completed)
    const habitCompletionDays = last7Days.filter(d => 
      d.totalHabits > 0 && d.habitCompletions === d.totalHabits
    ).length;
    const habitConsistency = Math.round((habitCompletionDays / 7) * 100);
    
    // Calculate trend (this week vs last week)
    const thisWeekCompletion = tasksScheduledWeek > 0 ? (tasksCompletedWeek / tasksScheduledWeek) : 0;
    const lastWeekCompleted = last14Days.slice(0, 7).reduce((sum, d) => sum + d.tasksCompleted, 0);
    const lastWeekScheduled = last14Days.slice(0, 7).reduce((sum, d) => sum + d.tasksScheduled, 0);
    const lastWeekCompletion = lastWeekScheduled > 0 ? (lastWeekCompleted / lastWeekScheduled) : 0;
    const trend = Math.round((thisWeekCompletion - lastWeekCompletion) * 100);
    
    // Calculate productivity streak (days with >80% completion)
    let productivityStreak = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const day = last7Days[i];
      const dayCompletion = day.tasksScheduled > 0 ? (day.tasksCompleted / day.tasksScheduled) : 0;
      if (dayCompletion >= 0.8) {
        productivityStreak++;
      } else {
        break;
      }
    }
    
    return {
      taskCompletionRate,
      tasksCompletedWeek,
      tasksScheduledWeek,
      habitConsistency,
      habitCompletionDays,
      trend,
      productivityStreak,
      dailyData: last7Days
    };
  },
  
  renderWeeklyHeatmap(dailyData) {
    const today = new Date();
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    return dailyData.map((day, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      const completion = day.tasksScheduled > 0 
        ? (day.tasksCompleted / day.tasksScheduled) 
        : 0;
      
      const level = completion >= 0.8 ? 'high' : completion >= 0.5 ? 'medium' : completion > 0 ? 'low' : 'none';
      
      return `
        <div class="heatmap-day ${level}" title="${dayName}: ${Math.round(completion * 100)}% completed">
          <div class="heatmap-label">${dayName}</div>
          <div class="heatmap-count">${day.tasksCompleted}/${day.tasksScheduled}</div>
        </div>
      `;
    }).join('');
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BURNOUT RISK SCORE
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderBurnoutRisk() {
    const container = document.getElementById('burnoutRisk');
    if (!container) return;
    
    const risk = this.calculateBurnoutRisk();
    
    container.innerHTML = `
      <div class="analytics-section">
        <div class="section-header">
          <h2><i data-lucide="activity"></i> Burnout Risk Assessment</h2>
          <p class="text-tertiary">Dein aktuelles Belastungslevel</p>
        </div>
        
        <!-- Risk Score -->
        <div class="risk-score-container">
          <div class="risk-score ${risk.level}">
            <div class="risk-value">${risk.score}</div>
            <div class="risk-label">${risk.label}</div>
          </div>
          <div class="risk-description">
            ${risk.message}
          </div>
        </div>
        
        <!-- Risk Factors -->
        <div class="risk-factors">
          <h3>Risk Factors</h3>
          <div class="factors-grid">
            ${risk.factors.map(factor => `
              <div class="factor-card ${factor.severity}">
                <div class="factor-icon">
                  <i data-lucide="${factor.icon}"></i>
                </div>
                <div class="factor-content">
                  <div class="factor-title">${factor.title}</div>
                  <div class="factor-value">${factor.value}</div>
                  <div class="factor-detail">${factor.detail}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Recommendations -->
        <div class="recommendations">
          <h3><i data-lucide="lightbulb"></i> Empfehlungen</h3>
          <ul>
            ${risk.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
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
    
    // Calculate risk factors
    const avgOverdue = last7Days.reduce((sum, d) => sum + d.overdueTasks, 0) / 7;
    const avgPlannedHours = last7Days.reduce((sum, d) => sum + (d.plannedMinutes || 0), 0) / (7 * 60);
    const currentOverdue = NexusStore.getOverdueTasks().length;
    
    // Get recreation sphere time (last 7 days)
    let recreationMinutes = 0;
    last7Days.forEach(day => {
      if (day.sphereMinutes && day.sphereMinutes.freizeit) {
        recreationMinutes += day.sphereMinutes.freizeit;
      }
    });
    const avgRecreationHours = recreationMinutes / 60 / 7;
    
    // Calculate risk score (0-100)
    let riskScore = 0;
    const factors = [];
    
    // Factor 1: Overdue tasks (max 30 points)
    const overdueRisk = Math.min(30, currentOverdue * 5);
    riskScore += overdueRisk;
    factors.push({
      title: 'Überfällige Tasks',
      value: currentOverdue,
      detail: `Ø ${avgOverdue.toFixed(1)} in den letzten 7 Tagen`,
      severity: currentOverdue > 5 ? 'high' : currentOverdue > 2 ? 'medium' : 'low',
      icon: 'alert-triangle'
    });
    
    // Factor 2: Daily load (max 30 points)
    const loadRisk = avgPlannedHours > 10 ? 30 : avgPlannedHours > 8 ? 20 : avgPlannedHours > 6 ? 10 : 0;
    riskScore += loadRisk;
    factors.push({
      title: 'Tägliche Arbeitslast',
      value: `${avgPlannedHours.toFixed(1)}h`,
      detail: `Ø geplante Zeit pro Tag`,
      severity: avgPlannedHours > 10 ? 'high' : avgPlannedHours > 8 ? 'medium' : 'low',
      icon: 'clock'
    });
    
    // Factor 3: Recreation time (max 20 points - inverse)
    const recreationRisk = avgRecreationHours < 0.5 ? 20 : avgRecreationHours < 1 ? 10 : 0;
    riskScore += recreationRisk;
    factors.push({
      title: 'Erholungszeit',
      value: `${avgRecreationHours.toFixed(1)}h`,
      detail: `Ø Freizeit pro Tag`,
      severity: avgRecreationHours < 0.5 ? 'high' : avgRecreationHours < 1 ? 'medium' : 'low',
      icon: 'coffee'
    });
    
    // Factor 4: Completion rate (max 20 points - inverse)
    const metrics = this.calculateCompletionMetrics();
    const completionRisk = metrics.taskCompletionRate < 50 ? 20 : metrics.taskCompletionRate < 70 ? 10 : 0;
    riskScore += completionRisk;
    factors.push({
      title: 'Completion Rate',
      value: `${metrics.taskCompletionRate}%`,
      detail: `Tasks erledigt (7 Tage)`,
      severity: metrics.taskCompletionRate < 50 ? 'high' : metrics.taskCompletionRate < 70 ? 'medium' : 'low',
      icon: 'check-circle'
    });
    
    // Determine risk level
    let level, label, message, recommendations;
    
    if (riskScore >= 70) {
      level = 'high';
      label = 'HOCH - Burnout-Gefahr!';
      message = '⚠️ Kritisches Belastungslevel! Du bist massiv überlastet. Sofortige Maßnahmen erforderlich.';
      recommendations = [
        'Streiche nicht-kritische Tasks von deiner Liste',
        'Blockiere mindestens 2 Stunden täglich für Erholung',
        'Delegiere Tasks wenn möglich',
        'Sprich mit jemandem über deine Belastung',
        'Erwäge professionelle Hilfe wenn das länger anhält'
      ];
    } else if (riskScore >= 40) {
      level = 'medium';
      label = 'MITTEL - Achtung!';
      message = '🟡 Erhöhte Belastung erkannt. Du solltest deine Workload reduzieren.';
      recommendations = [
        'Reduziere deine tägliche Planned Time um 20%',
        'Priorisiere nur kritische Tasks',
        'Plane bewusst Erholungspausen ein',
        'Checke ob du zu viele Projekte gleichzeitig läuft',
        'Verbessere deine Time Estimation'
      ];
    } else {
      level = 'low';
      label = 'NIEDRIG - Alles gut!';
      message = '✅ Gesundes Belastungslevel. Du hast deine Workload im Griff!';
      recommendations = [
        'Behalte dein aktuelles Tempo bei',
        'Achte weiterhin auf Work-Life-Balance',
        'Nutze freie Kapazität für langfristige Ziele',
        'Experimentiere mit neuen Produktivitäts-Methoden'
      ];
    }
    
    return {
      score: riskScore,
      level,
      label,
      message,
      factors,
      recommendations
    };
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SPHERE BALANCE TRACKER
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderSphereBalance() {
    const container = document.getElementById('sphereBalance');
    if (!container) return;
    
    const balance = this.calculateSphereBalance();
    
    container.innerHTML = `
      <div class="analytics-section">
        <div class="section-header">
          <h2><i data-lucide="pie-chart"></i> Sphere Balance</h2>
          <p class="text-tertiary">Zeit-Verteilung über deine Life Spheres</p>
        </div>
        
        <!-- Balance Chart -->
        <div class="balance-chart">
          <div class="pie-chart">
            ${this.renderPieChart(balance.distribution)}
          </div>
          <div class="sphere-legend">
            ${balance.spheres.map(sphere => `
              <div class="legend-item">
                <div class="legend-color" style="background: ${sphere.color}"></div>
                <div class="legend-content">
                  <div class="legend-label">${sphere.icon} ${sphere.name}</div>
                  <div class="legend-value">${sphere.hours}h (${sphere.percentage}%)</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Balance Warning -->
        ${balance.warning ? `
          <div class="balance-warning">
            <i data-lucide="alert-circle"></i>
            <div>
              <strong>Unbalance erkannt!</strong>
              <p>${balance.warning}</p>
            </div>
          </div>
        ` : `
          <div class="balance-success">
            <i data-lucide="check-circle"></i>
            <div>
              <strong>Gute Balance!</strong>
              <p>Deine Zeit ist relativ ausgewogen über die Spheres verteilt.</p>
            </div>
          </div>
        `}
        
        <!-- Sphere Trends (Last 7 Days) -->
        <div class="sphere-trends">
          <h3>Trends (Last 7 Days)</h3>
          <div class="trends-grid">
            ${balance.trends.map(trend => `
              <div class="trend-card">
                <div class="trend-header">
                  <span>${trend.icon} ${trend.name}</span>
                  <span class="${trend.change >= 0 ? 'text-success' : 'text-danger'}">
                    ${trend.change >= 0 ? '+' : ''}${trend.change}%
                  </span>
                </div>
                <div class="trend-bar">
                  <div class="trend-fill" style="width: ${Math.min(100, trend.percentage)}%; background: ${trend.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    NexusUI.refreshIcons();
  },
  
  calculateSphereBalance() {
    const history = NexusStore.getAnalyticsHistory();
    const today = new Date();
    const last7Days = [];
    const last14Days = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(history[dateStr] || { sphereMinutes: {} });
    }
    
    // Get previous 7 days for trend
    for (let i = 13; i >= 7; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last14Days.push(history[dateStr] || { sphereMinutes: {} });
    }
    
    // Calculate total minutes per sphere (last 7 days)
    const sphereMinutes = {};
    last7Days.forEach(day => {
      Object.entries(day.sphereMinutes || {}).forEach(([sphere, minutes]) => {
        sphereMinutes[sphere] = (sphereMinutes[sphere] || 0) + minutes;
      });
    });
    
    // Calculate previous week totals
    const prevSphereMinutes = {};
    last14Days.forEach(day => {
      Object.entries(day.sphereMinutes || {}).forEach(([sphere, minutes]) => {
        prevSphereMinutes[sphere] = (prevSphereMinutes[sphere] || 0) + minutes;
      });
    });
    
    const totalMinutes = Object.values(sphereMinutes).reduce((sum, m) => sum + m, 0);
    const prevTotalMinutes = Object.values(prevSphereMinutes).reduce((sum, m) => sum + m, 0);
    
    // Get sphere definitions
    const sphereDefinitions = NexusStore.state.spheres;
    
    // Build distribution data
    const spheres = sphereDefinitions.map(sphere => {
      const minutes = sphereMinutes[sphere.id] || 0;
      const prevMinutes = prevSphereMinutes[sphere.id] || 0;
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      const prevPercentage = prevTotalMinutes > 0 ? Math.round((prevMinutes / prevTotalMinutes) * 100) : 0;
      const change = percentage - prevPercentage;
      
      return {
        id: sphere.id,
        name: sphere.name,
        icon: sphere.icon,
        color: sphere.color,
        minutes,
        hours: (minutes / 60).toFixed(1),
        percentage,
        change
      };
    }).sort((a, b) => b.percentage - a.percentage);
    
    // Check for imbalance (one sphere >60%)
    const dominantSphere = spheres.find(s => s.percentage > 60);
    const warning = dominantSphere 
      ? `${dominantSphere.icon} ${dominantSphere.name} dominiert mit ${dominantSphere.percentage}%. Andere Lebensbereiche könnten zu kurz kommen.`
      : null;
    
    return {
      distribution: spheres,
      spheres,
      trends: spheres,
      warning
    };
  },
  
  renderPieChart(distribution) {
    const total = distribution.reduce((sum, s) => sum + s.percentage, 0);
    if (total === 0) {
      return '<div class="text-tertiary text-center p-4">Keine Daten verfügbar</div>';
    }
    
    let currentAngle = 0;
    const radius = 100;
    const centerX = 120;
    const centerY = 120;
    
    const slices = distribution.map(sphere => {
      if (sphere.percentage === 0) return '';
      
      const angle = (sphere.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle = endAngle;
      
      // Calculate arc path
      const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M ${centerX},${centerY} L ${startX},${startY} A ${radius},${radius} 0 ${largeArc},1 ${endX},${endY} Z`;
      
      return `<path d="${path}" fill="${sphere.color}" stroke="#1a1a1a" stroke-width="2"/>`;
    }).join('');
    
    return `
      <svg viewBox="0 0 240 240" class="pie-svg">
        ${slices}
      </svg>
    `;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 4. NEGLECTED WORK (VERGESSENE TASKS/PROJEKTE/VENTURES)
  // ═══════════════════════════════════════════════════════════════════════════
  
  renderNeglectedWork() {
    const container = document.getElementById('neglectedWork');
    if (!container) return;
    
    const neglected = NexusStore.getNeglectedWork(7, 14, 14);
    const totalNeglected = neglected.tasks.length + neglected.projects.length + neglected.ventures.length;
    
    container.innerHTML = `
      <div class="analytics-section">
        <div class="section-header">
          <h2><i data-lucide="alert-triangle"></i> Vernachlässigte Arbeit</h2>
          <p class="text-tertiary">Tasks, Projekte und Ventures, die lange nicht bearbeitet wurden</p>
          ${totalNeglected > 0 ? 
            `<div class="alert alert-warning" style="margin-top: 1rem;">
              <i data-lucide="alert-circle"></i>
              <span>Du hast ${totalNeglected} ${totalNeglected === 1 ? 'Element' : 'Elemente'}, die seit längerer Zeit nicht bearbeitet wurden!</span>
            </div>` : 
            `<div class="alert alert-success" style="margin-top: 1rem;">
              <i data-lucide="check-circle"></i>
              <span>Super! Du hast keine vernachlässigten Tasks oder Projekte. Alles im Griff! 🎉</span>
            </div>`
          }
        </div>
        
        <!-- Forgotten Tasks -->
        <div class="metric-group">
          <h3 class="metric-group-title">
            <i data-lucide="list-todo"></i> 
            Vergessene Tasks (>7 Tage)
            <span class="badge ${neglected.tasks.length > 0 ? 'badge-danger' : 'badge-success'}">${neglected.tasks.length}</span>
          </h3>
          
          ${neglected.tasks.length === 0 ? 
            '<p class="text-tertiary" style="padding: 1rem;">Keine vergessenen Tasks! 👍</p>' :
            `<div class="neglected-list">
              ${neglected.tasks.map(task => `
                <div class="neglected-item task-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${task.title}</div>
                      <div class="item-meta">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        ${task.sphere ? `<span class="sphere-badge">${task.sphere}</span>` : ''}
                        ${task.projectId ? `<span class="project-badge">Projekt</span>` : ''}
                      </div>
                    </div>
                    <div class="days-badge danger">
                      <i data-lucide="clock"></i>
                      ${task.daysSinceUpdate} ${task.daysSinceUpdate === 1 ? 'Tag' : 'Tage'}
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="btn-small btn-primary" onclick="NexusRouter.navigate('tasks')">
                      <i data-lucide="external-link"></i> Ansehen
                    </button>
                    <button class="btn-small btn-success" onclick="NexusStore.completeTask('${task.id}'); Analytics.render();">
                      <i data-lucide="check"></i> Erledigen
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
        
        <!-- Stale Projects -->
        <div class="metric-group" style="margin-top: 2rem;">
          <h3 class="metric-group-title">
            <i data-lucide="folder"></i> 
            Vernachlässigte Projekte (>14 Tage)
            <span class="badge ${neglected.projects.length > 0 ? 'badge-warning' : 'badge-success'}">${neglected.projects.length}</span>
          </h3>
          
          ${neglected.projects.length === 0 ? 
            '<p class="text-tertiary" style="padding: 1rem;">Keine vernachlässigten Projekte! 👍</p>' :
            `<div class="neglected-list">
              ${neglected.projects.map(project => `
                <div class="neglected-item project-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${project.name}</div>
                      <div class="item-meta">
                        <span class="status-badge status-${project.status}">${project.status}</span>
                        ${project.sphere ? `<span class="sphere-badge">${project.sphere}</span>` : ''}
                      </div>
                    </div>
                    <div class="days-badge warning">
                      <i data-lucide="clock"></i>
                      ${project.daysSinceUpdate} ${project.daysSinceUpdate === 1 ? 'Tag' : 'Tage'}
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="btn-small btn-primary" onclick="NexusRouter.navigate('projects'); NexusRouter.openProjectDetail('${project.id}');">
                      <i data-lucide="external-link"></i> Ansehen
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
        
        <!-- Stale Ventures -->
        <div class="metric-group" style="margin-top: 2rem;">
          <h3 class="metric-group-title">
            <i data-lucide="rocket"></i> 
            Vernachlässigte Ventures (>14 Tage)
            <span class="badge ${neglected.ventures.length > 0 ? 'badge-warning' : 'badge-success'}">${neglected.ventures.length}</span>
          </h3>
          
          ${neglected.ventures.length === 0 ? 
            '<p class="text-tertiary" style="padding: 1rem;">Keine vernachlässigten Ventures! 👍</p>' :
            `<div class="neglected-list">
              ${neglected.ventures.map(venture => `
                <div class="neglected-item venture-item">
                  <div class="item-header">
                    <div>
                      <div class="item-title">${venture.name}</div>
                      <div class="item-meta">
                        <span class="status-badge status-${venture.status}">${venture.status}</span>
                        ${venture.spheres && venture.spheres.length > 0 ? `<span class="sphere-badge">${venture.spheres[0]}</span>` : ''}
                      </div>
                    </div>
                    <div class="days-badge warning">
                      <i data-lucide="clock"></i>
                      ${venture.daysSinceUpdate} ${venture.daysSinceUpdate === 1 ? 'Tag' : 'Tage'}
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="btn-small btn-primary" onclick="NexusRouter.navigate('ventures'); setTimeout(() => VentureHub.openVentureDetail('${venture.id}'), 100);">
                      <i data-lucide="external-link"></i> Ansehen
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>`
          }
        </div>
      </div>
    `;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getCompletionClass(percentage) {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  },
  
  getCompletionColor(percentage) {
    if (percentage >= 80) return 'var(--success)';
    if (percentage >= 60) return 'var(--warning)';
    return 'var(--danger)';
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
